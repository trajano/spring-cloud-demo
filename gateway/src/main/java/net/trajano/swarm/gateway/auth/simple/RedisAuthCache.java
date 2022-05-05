package net.trajano.swarm.gateway.auth.simple;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.crypto.KeyGenerator;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import static reactor.core.publisher.Mono.fromCallable;
import static reactor.core.publisher.Mono.just;

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

  private KeyGenerator keyGenerator;

  private KeyFactory rsaKeyFactory;

  private KeyPairGenerator keyPairGenerator;

  private SecureRandom secureRandom;

  private final ReactiveStringRedisTemplate redisTemplate;

  private final RedisKeyBlocks redisKeyBlocks;

  private final SimpleAuthServiceProperties simpleAuthServiceProperties;

  /**
   * The key regeneration scheduler. This is a single thread executor as there's only one of these.
   */
  private final ScheduledExecutorService scheduledExecutorService =
      Executors.newSingleThreadScheduledExecutor();

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
  private String generateRefreshToken() {

    final byte[] bytes = new byte[64];
    secureRandom.nextBytes(bytes);

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds() / 60.0f);
    return jwtClaims.toJson();
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
        getSigningKey()
            .map(signingJwks -> JwtFunctions.sign(signingJwks, authenticationItem.getAccessToken()))
            .map(
                jwt ->
                    simpleAuthServiceProperties.isCompressClaims()
                        ? ZLibStringCompression.compress(jwt)
                        : jwt);
    final var signedRefreshTokenMono =
        getSigningKey()
            .map(
                signingJwks ->
                    JwtFunctions.sign(signingJwks, authenticationItem.getRefreshToken()));

    return Mono.zip(signedAccessTokenMono, signedRefreshTokenMono)
        .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()));
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
    final var refreshToken = generateRefreshToken();

    try {
      final var jwtId = authenticationItem.getJwtClaims().getJwtId();
      final var refreshTokenRedisKey = redisKeyBlocks.refreshTokenKey(refreshToken);
      final var accessTokenJtiKey = redisKeyBlocks.accessTokenJtiKey(jwtId);

      final var refreshTokenMono =
          Flux.fromIterable(authenticationItem.getSecret().entrySet())
              .concatWithValues(Map.entry("jti", jwtId))
              .flatMap(
                  entry -> ops.putIfAbsent(refreshTokenRedisKey, entry.getKey(), entry.getValue()))
              .count()
              .filter(count -> count == authenticationItem.getSecret().size() + 1)
              .switchIfEmpty(Mono.error(IllegalStateException::new))
              .thenReturn(refreshToken);

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

      return Mono.zip(accessTokenMono, refreshTokenMono)
          .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()));
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }
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
   * Given the username, create a simulated backend credential data and provide the
   * OAuthTokenResponse mono.
   *
   * @param username username
   * @return oauth token
   */
  public Mono<OAuthTokenResponse> provideOAuthTokenWithUserName(String username) {

    return provideRefreshToken()
        .flatMap(
            refreshToken ->
                Mono.zip(
                    fromCallable(() -> provideJwtClaims(username))
                        .map(JwtClaims::toJson)
                        .flatMap(claimsJson -> Mono.zip(getSigningKey(), Mono.just(claimsJson)))
                        .map(tuple -> JwtFunctions.sign(tuple.getT1(), tuple.getT2())),
                    provideAuthenticatedDataMono(
                        refreshToken, username, UUID.randomUUID().toString()),
                    just(refreshToken)))
        .map(
            t2 -> {
              final var operationResponse = new OAuthTokenResponse();
              operationResponse.setOk(true);
              if (simpleAuthServiceProperties.isCompressClaims()) {
                operationResponse.setAccessToken(ZLibStringCompression.compress(t2.getT1()));
              } else {
                operationResponse.setAccessToken(t2.getT1());
              }
              operationResponse.setRefreshToken(t2.getT3());
              operationResponse.setExpiresIn(
                  simpleAuthServiceProperties.getAccessTokenExpiresInSeconds());
              return operationResponse;
            });
  }

  /**
   * @param refreshToken refresh token
   * @return may be empty if it does not exist or cannot be regenerated
   */
  public Mono<OAuthTokenResponse> provideRefreshedOAuthToken(final String refreshToken) {

    final ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();

    final var currentRefreshTokenKey = redisKeyBlocks.refreshTokenKey(refreshToken);
    return redisTemplate
        .hasKey(currentRefreshTokenKey)
        .filter(exists -> exists)
        .map(v -> ops.entries(currentRefreshTokenKey))
        .flatMap(Flux::collectList)
        .flatMap(
            entries ->
                Mono.zip(
                    provideRefreshToken(), just(Map.ofEntries(entries.toArray(Map.Entry[]::new)))))
        .flatMap(
            tuple -> {
              var newRefreshToken = tuple.getT1();
              // at this point if this was a real system it will use the map data to revalidate the
              // authentication
              final var username = (String) tuple.getT2().get("username");
              final var secret = (String) tuple.getT2().get("secret");
              var oauthTokenBaseMono = provideOAuthTokenWithUserName(username);

              return Mono.zip(
                  just(refreshToken),
                  oauthTokenBaseMono,
                  provideAuthenticatedDataMono(newRefreshToken, username, secret));
            })
        .map(
            tuple -> {
              final var oAuthTokenResponse = tuple.getT2();
              oAuthTokenResponse.setRefreshToken(tuple.getT1());
              return oAuthTokenResponse;
            })
        .doOnNext(v -> redisTemplate.delete(currentRefreshTokenKey).subscribe());
  }

  /**
   * Given a refresh token mono and the username, create a "payload" to represent secret data and
   * store it into Redis as a hash and set it to expire in 30 seconds.
   *
   * @param refreshToken refresh token
   * @param username username
   * @param someSecret someSecret
   */
  private Mono<Map<String, String>> provideAuthenticatedDataMono(
      String refreshToken, String username, String someSecret) {

    var payload = Map.of("username", username, "secret", someSecret);
    ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();

    return RedisFunctions.putIfAbsent(ops, redisKeyBlocks.refreshTokenKey(refreshToken), payload)
        .filter(success -> success)
        .switchIfEmpty(Mono.error(new IllegalStateException("unable to add")))
        .map(
            ignored ->
                redisTemplate.expireAt(
                    redisKeyBlocks.refreshTokenKey(refreshToken),
                    Instant.now()
                        .plusSeconds(
                            simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds())))
        .map(ignored -> payload);
  }

  private JwtClaims provideJwtClaims(String username) {

    final var claims = new JwtClaims();
    claims.setGeneratedJwtId();
    claims.setSubject(username);
    claims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getAccessTokenExpiresInSeconds() / 60.0f);
    return claims;
  }

  @PostConstruct
  public void initializeCrypto() {

    try {
      keyGenerator = KeyGenerator.getInstance("AES");
      keyPairGenerator = KeyPairGenerator.getInstance(RSA);
      keyPairGenerator.initialize(4096);
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

  private Mono<JsonWebKeySet> getSigningKey() {

    return adjustExpiration()
        .flatMap(
            x -> {
              final var opsForSet = redisTemplate.opsForSet();
              return opsForSet
                  .randomMember(redisKeyBlocks.currentSigningRedisKey())
                  .map(RedisAuthCache::stringToJwks);
            });
  }

  private Mono<Boolean> adjustExpiration() {

    return redisTemplate.expireAt(
        redisKeyBlocks.currentSigningRedisKey(),
        redisKeyBlocks.nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration());
  }

  /**
   * Provides the refresh token. Made public to allow testing/
   *
   * @return refresh token mono
   */
  public Mono<String> provideRefreshToken() {

    return fromCallable(this::generateRefreshToken);
  }

  public Flux<JsonWebKey> jwks() {

    final var ops = redisTemplate.opsForSet();
    return Flux.merge(
            ops.scan(redisKeyBlocks.currentSigningRedisKey()),
            ops.scan(redisKeyBlocks.previousSigningRedisKey()))
        .map(RedisAuthCache::stringToJwks)
        .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
        .filter(jwk -> RSA.equals(jwk.getKeyType()));
  }
}
