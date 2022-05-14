package net.trajano.swarm.gateway.auth.simple;

import java.security.*;
import java.time.Duration;
import java.util.*;
import javax.annotation.PostConstruct;
import javax.crypto.KeyGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * There's a few redis keys that are used.
 *
 * <p>1. Symettric keys
 *
 * <p>
 *
 * <p>Keep note that there are limitations on Redis that one must be aware of.
 *
 * @see
 *     <ul>
 *       <li><a
 *           href="https://stackoverflow.com/questions/51498737/how-to-use-redis-scan-in-cluster-enviroment">You
 *           cannot SCAN across cluster nodes</a>>
 *       <li><a href=https://github.com/redis/redis/issues/242#issuecomment-3512819">Inability to
 *           expire hash elements.</a>>
 *     </ul>
 */
@RequiredArgsConstructor
@Slf4j
public class RedisAuthCache {

  public static final String RSA = "RSA";

  private final ReactiveStringRedisTemplate redisTemplate;

  private final SimpleAuthRedisKeyBlocks redisKeyBlocks;

  private final SimpleAuthServiceProperties simpleAuthServiceProperties;

  private final Scheduler generateRefreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "generateRefreshToken");
  private final Scheduler signingGenerator =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "signing");

  private KeyGenerator keyGenerator;

  private SecureRandom secureRandom;

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  /**
   * Generates a refresh token, it's in a form of a JWT claimset JSON so it can be signed.
   *
   * @return refresh token
   */
  private String generateRefreshToken(Random random) {

    final byte[] bytes = new byte[32];
    random.nextBytes(bytes);

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds() / 60.0f);
    return jwtClaims.toJson();
  }

  private final JwksProvider jwksProvider;

  @PostConstruct
  @SuppressWarnings("unused")
  public void initializeCrypto() {

    try {
      keyGenerator = KeyGenerator.getInstance("AES");
      secureRandom = SecureRandom.getInstanceStrong();
      keyGenerator.init(256, secureRandom);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public Mono<Boolean> isJwtIdValid(String jwtId) {

    return redisTemplate.hasKey(redisKeyBlocks.accessTokenJtiKey(jwtId));
  }

  public AuthenticationItem populateClaimsFromSecret(AuthenticationItem authenticationItem) {

    var jwtClaims = new JwtClaims();
    jwtClaims.setGeneratedJwtId();
    jwtClaims.setIssuer("https://localhost");
    jwtClaims.setSubject(authenticationItem.getSecret().get("username"));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getAccessTokenExpiresInSeconds() / 60.0f);
    return authenticationItem.withJwtClaims(jwtClaims);
  }

  public Mono<AuthenticationItem> populateSecretFromRefreshToken(
      AuthenticationItem authenticationItem) {

    final ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();
    return ops.entries(redisKeyBlocks.refreshTokenKey(authenticationItem.getRefreshToken()))
        .filter(entry -> !"jti".equals(entry.getKey()))
        .switchIfEmpty(Mono.error(SecurityException::new))
        .collect(HashMap::new, (a, b) -> a.put(b.getKey(), b.getValue()))
        .cast(Map.class)
        .map(authenticationItem::withSecret);
  }

  /**
   * Signs both the refresh token and JWT claims
   *
   * @param authenticationItem
   * @return
   */
  public Mono<AuthenticationItem> provideAccessTokenAndRefreshToken(
      AuthenticationItem authenticationItem) {

    final var signedAccessTokenMono =
        jwksProvider
            .getSigningKey(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())
            .publishOn(Schedulers.parallel())
            .map(signingJwks -> JwtFunctions.sign(signingJwks, authenticationItem.getAccessToken()))
            .map(
                jwt ->
                    simpleAuthServiceProperties.isCompressClaims()
                        ? ZLibStringCompression.compress(jwt)
                        : jwt);
    final var signedRefreshTokenMono =
        jwksProvider
            .getSigningKey(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())
            .publishOn(Schedulers.parallel())
            .map(
                signingJwks ->
                    JwtFunctions.sign(signingJwks, authenticationItem.getRefreshToken()));

    return Mono.zip(signedAccessTokenMono, signedRefreshTokenMono)
        .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()))
        .publishOn(generateRefreshTokenScheduler);
  }

  public AuthenticationItem provideClaimsAndSecret(AuthenticationItem authenticationItem) {

    final var claims = new JwtClaims();
    claims.setGeneratedJwtId();
    claims.setIssuer("https://localhost");
    claims.setSubject(authenticationItem.getAuthenticationRequest().getUsername());
    claims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getAccessTokenExpiresInSeconds() / 60.0f);

    return authenticationItem
        .withJwtClaims(claims)
        .withSecret(
            Map.of(
                "username",
                authenticationItem.getAuthenticationRequest().getUsername(),
                "secret",
                UUID.randomUUID().toString()));
  }

  /**
   * This stage will create a refresh token which is stored in redis pointing to the secret and has
   * a key that is pointing to the JTI of the claims called {@code jti}. It also adds the JTI to
   * redis under a different key
   *
   * @param authenticationItem
   * @return
   */
  public Mono<AuthenticationItem> provideClaimsJsonAndUnsignedRefreshToken(
      AuthenticationItem authenticationItem) {

    final ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();
    final ReactiveValueOperations<String, String> valueOps = redisTemplate.opsForValue();

    try {
      final var jwtId = authenticationItem.getJwtClaims().getJwtId();
      final var accessTokenJtiKey = redisKeyBlocks.accessTokenJtiKey(jwtId);

      final var accessTokenMono =
          valueOps
              .setIfAbsent(accessTokenJtiKey, jwtId)
              .filter(success -> success)
              .switchIfEmpty(
                  Mono.error(
                      new IllegalStateException(
                          "unable to set if absent the JWT %s".formatted(accessTokenJtiKey))))
              .flatMap(
                  ignored ->
                      redisTemplate.expire(
                          accessTokenJtiKey,
                          Duration.ofSeconds(
                              simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())))
              .thenReturn(authenticationItem.getJwtClaims().toJson());

      var refreshTokenMono =
          Mono.just(secureRandom)
              .publishOn(Schedulers.parallel())
              .map(this::generateRefreshToken)
              .publishOn(generateRefreshTokenScheduler)
              .flatMap(
                  refreshToken -> {
                    final var refreshTokenRedisKey = redisKeyBlocks.refreshTokenKey(refreshToken);
                    final var secretMap = new HashMap<>(authenticationItem.getSecret());
                    secretMap.put("jti", jwtId);
                    return ops.putAll(refreshTokenRedisKey, secretMap)
                        .filter(success -> success)
                        .switchIfEmpty(
                            Mono.error(
                                new IllegalStateException(
                                    "unable to locate expected entry in Redis refresh token:%s secrets:%s"
                                        .formatted(refreshToken, secretMap))))
                        .thenReturn(refreshToken);
                  });

      return Mono.zip(accessTokenMono, refreshTokenMono)
          .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()));
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }
  }

  public OAuthTokenResponse provideOAuthToken(AuthenticationItem authenticationItem) {

    var response = new OAuthTokenResponse();
    response.setOk(true);
    response.setAccessToken(authenticationItem.getAccessToken());
    response.setRefreshToken(authenticationItem.getRefreshToken());
    response.setTokenType("Bearer");
    response.setExpiresIn(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds());
    return response;
  }

  /**
   * @param refreshToken validated refresh token
   * @return
   */
  public Mono<Long> revoke(String refreshToken) {

    final ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();
    final var refreshTokenRedisKey = redisKeyBlocks.refreshTokenKey(refreshToken);
    return ops.get(refreshTokenRedisKey, "jti")
        .flatMap(jti -> redisTemplate.delete(redisKeyBlocks.accessTokenJtiKey(jti)))
        .defaultIfEmpty(0L)
        .flatMap(ignored -> redisTemplate.delete(refreshTokenRedisKey));
  }

  private Mono<Boolean> storeSigningKeysInRedis(final List<String> jwks) {

    final var opsForSet = redisTemplate.opsForSet();
    return opsForSet
        .add(redisKeyBlocks.currentSigningRedisKey(), jwks.toArray(String[]::new))
        .flatMap(
            x ->
                redisTemplate.expireAt(
                    redisKeyBlocks.currentSigningRedisKey(),
                    redisKeyBlocks.nextTimeBlockForSigningKeys().plusSeconds(30)));
  }
}
