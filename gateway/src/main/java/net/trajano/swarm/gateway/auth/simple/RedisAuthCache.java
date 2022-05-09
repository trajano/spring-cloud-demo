package net.trajano.swarm.gateway.auth.simple;

import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.crypto.KeyGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;
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
 * <ul>
 *   <li><a
 *       href="https://stackoverflow.com/questions/51498737/how-to-use-redis-scan-in-cluster-enviroment">You
 *       cannot SCAN across cluster nodes</a>>
 *   <li><a href=https://github.com/redis/redis/issues/242#issuecomment-3512819">Inability to expire
 *       hash elements.</a>>
 * </ul>
 */
@RequiredArgsConstructor
@Slf4j
public class RedisAuthCache {

  public static final String RSA = "RSA";

  private final ReactiveStringRedisTemplate redisTemplate;

  private final RedisKeyBlocks redisKeyBlocks;

  private final SimpleAuthServiceProperties simpleAuthServiceProperties;

  private final Scheduler generateRefreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "generateRefreshToken");

  /**
   * The key regeneration scheduler. This is a single thread executor as there's only one of these.
   */
  private final ScheduledExecutorService scheduledExecutorService =
      Executors.newSingleThreadScheduledExecutor();

  private KeyGenerator keyGenerator;

  private KeyPairGenerator keyPairGenerator;

  private KeyFactory rsaKeyFactory;

  private SecureRandom secureRandom;

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  private Mono<Boolean> adjustExpiration() {

    return redisTemplate
        .expireAt(
            redisKeyBlocks.currentSigningRedisKey(),
            redisKeyBlocks.nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration())
        .publishOn(Schedulers.boundedElastic());
  }

  @PreDestroy
  public void close() {

    scheduledExecutorService.shutdown();
  }

  private Flux<String> generateKeyPairs() {

    return Flux.generate(
            (Consumer<SynchronousSink<KeyPair>>)
                synchronousSink -> {
                  final var keyPair = keyPairGenerator.generateKeyPair();
                  synchronousSink.next(keyPair);
                })
        .flatMap(
            keyPair -> {
              final var privateKey = keyPair.getPrivate();
              final var publicKey = (RSAPublicKey) keyPair.getPublic();

              final var kid = UUID.randomUUID().toString();

              final var jwks = new JsonWebKeySet();
              try {
                final var jwkPublic = JsonWebKey.Factory.newJwk(publicKey);
                jwkPublic.setKeyId(kid);
                jwks.addJsonWebKey(jwkPublic);
                jwks.addJsonWebKey(JsonWebKey.Factory.newJwk(privateKey));
                return Mono.just(jwks.toJson());
              } catch (JoseException e) {
                return Mono.error(e);
              }
            });
  }

  /**
   * Generates a refresh token, it's in a form of a JWT claimset JSON so it can be signed.
   *
   * @return refresh token
   */
  private String generateRefreshToken() {

    final byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds() / 60.0f);
    return jwtClaims.toJson();
  }

  public void generateSigningKeys() {

    var numberOfKeys = 3;

    redisTemplate
        .hasKey(redisKeyBlocks.currentSigningRedisKey())
        .flatMap(
            hasKey -> {
              if (Boolean.TRUE.equals(hasKey)) {
                return Mono.empty();
              } else {
                return generateKeyPairs()
                    .take(numberOfKeys)
                    .collectList()
                    .flatMap(this::storeSigningKeysInRedis);
              }
            })
        .subscribe();
  }

  private Mono<JsonWebKeySet> getSigningKey() {

    return adjustExpiration()
        .flatMap(
            x -> {
              final var opsForSet = redisTemplate.opsForSet();
              return opsForSet
                  .randomMember(redisKeyBlocks.currentSigningRedisKey())
                  .map(RedisAuthCache::stringToJwks);
            })
        .publishOn(Schedulers.boundedElastic());
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void initializeCrypto() {

    try {
      keyGenerator = KeyGenerator.getInstance("AES");
      keyPairGenerator = KeyPairGenerator.getInstance(RSA);
      keyPairGenerator.initialize(2048);
      secureRandom = SecureRandom.getInstanceStrong();
      keyGenerator.init(256, secureRandom);
      rsaKeyFactory = KeyFactory.getInstance(RSA);
      generateSigningKeys();
      scheduledExecutorService.scheduleAtFixedRate(
          this::generateSigningKeys,
          redisKeyBlocks.nextTimeBlockForSigningKeys().getEpochSecond()
              - Instant.now().getEpochSecond(),
          simpleAuthServiceProperties.getSigningKeyExpiresInSeconds(),
          TimeUnit.SECONDS);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public Mono<Boolean> isJwtIdValid(String jwtId) {

    return redisTemplate.hasKey(redisKeyBlocks.accessTokenJtiKey(jwtId));
  }

  public Flux<JsonWebKey> jwks() {

    final ReactiveSetOperations<String, String> ops = redisTemplate.opsForSet();

    return redisTemplate
        .getExpire(redisKeyBlocks.currentSigningRedisKey())
        .publishOn(Schedulers.boundedElastic())
        .filter(duration -> !duration.isZero())
        // at this point a I have a duration that is positive or empty or else illegal state since
        // signing keys must always have an expiration and must exist
        .switchIfEmpty(Mono.error(IllegalStateException::new))
        .flatMapMany(
            duration ->
                Flux.merge(
                        ops.scan(redisKeyBlocks.currentSigningRedisKey()),
                        ops.scan(redisKeyBlocks.previousSigningRedisKey()))
                    .publishOn(Schedulers.boundedElastic())
                    .map(RedisAuthCache::stringToJwks)
                    .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
                    .filter(jwk -> RSA.equals(jwk.getKeyType()))
                    .cache(duration));
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
        getSigningKey()
            .map(signingJwks -> JwtFunctions.sign(signingJwks, authenticationItem.getAccessToken()))
            .map(
                jwt ->
                    simpleAuthServiceProperties.isCompressClaims()
                        ? ZLibStringCompression.compress(jwt)
                        : jwt)
            .subscribeOn(Schedulers.boundedElastic());
    final var signedRefreshTokenMono =
        getSigningKey()
            .map(
                signingJwks -> JwtFunctions.sign(signingJwks, authenticationItem.getRefreshToken()))
            .subscribeOn(Schedulers.boundedElastic());

    return Mono.zip(signedAccessTokenMono, signedRefreshTokenMono)
        .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()));
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
              .switchIfEmpty(Mono.error(IllegalStateException::new))
              .flatMap(
                  ignored ->
                      redisTemplate.expire(
                          accessTokenJtiKey,
                          Duration.ofSeconds(
                              simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())))
              .filter(success -> success)
              .switchIfEmpty(Mono.error(IllegalStateException::new))
              .thenReturn(authenticationItem.getJwtClaims().toJson());

      var refreshTokenMono =
          Mono.fromCallable(this::generateRefreshToken)
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
