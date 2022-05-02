package net.trajano.swarm.gateway.auth.simple;

import static reactor.core.publisher.Mono.fromCallable;
import static reactor.core.publisher.Mono.just;

import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import javax.annotation.PostConstruct;
import javax.crypto.KeyGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;

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

    public static final Pattern REFRESH_TOKEN_PATTERN = Pattern.compile("[A-Za-z\\d\\-_]{42}");

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

  public Mono<OAuthTokenResponse> provideOAuthTokenWithUserName(
      String username, final int accessTokenExpiresInSeconds) {

    var refreshTokenMono = provideRefreshToken();

    // around here store the refresh token data

    var authenticationDataMono =
        provideAuthenticatedDataMono(refreshTokenMono, username, UUID.randomUUID().toString());

    var signingKeyMono = getSigningKey();
    var jwtClaimsMono =
        fromCallable(() -> provideJwtClaims(username, accessTokenExpiresInSeconds))
            .map(JwtClaims::toJson)
            .flatMap(claimsJson -> Mono.zip(signingKeyMono, Mono.just(claimsJson)))
            .map(
                tuple -> {
                  var signingKey = getSigningKeyFromJwks(tuple.getT1());
                  var kid = getKeyIdFromJwks(tuple.getT1());
                  final var jws = new JsonWebSignature();
                  jws.setKeyIdHeaderValue(kid);
                  jws.setPayload(tuple.getT2());
                  jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
                  jws.setKey(signingKey);
                  try {
                    jws.sign();
                    return jws.getCompactSerialization();
                  } catch (JoseException e) {
                    throw new IllegalStateException(e);
                  }
                });

    return Mono.zip(jwtClaimsMono, refreshTokenMono, authenticationDataMono)
        .map(
            t2 -> {
              final var operationResponse = new OAuthTokenResponse();
              operationResponse.setOk(true);
              if (simpleAuthServiceProperties.isCompressClaims()) {
                operationResponse.setAccessToken(ZLibStringCompression.compress(t2.getT1()));
              } else {
                operationResponse.setAccessToken(t2.getT1());
              }
              operationResponse.setRefreshToken(t2.getT2());
              operationResponse.setExpiresIn(accessTokenExpiresInSeconds);
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
    System.out.println(currentRefreshTokenKey);
    return redisTemplate
        .hasKey(currentRefreshTokenKey)
            .filter(exists->exists)
            .map(v->ops.entries(currentRefreshTokenKey))
            //.doOnEach(e-> System.out.println(e.get()))
            .flatMap(Flux::collectList)
            .doOnEach(e-> System.out.println(e.get()))
        .flatMap(
            entries ->
                Mono.zip(
                    provideRefreshToken(),
                    just(Map.ofEntries(entries.toArray(Map.Entry[]::new)))))
        .flatMap(
            tuple -> {
              var newRefreshToken = tuple.getT1();
              // at this point if this was a real system it will use the map data to revalidate the
              // authentication
              final var username = (String) tuple.getT2().get("username");
              final var secret = (String) tuple.getT2().get("secret");
              var oauthTokenBaseMono =
                  provideOAuthTokenWithUserName(
                      username, simpleAuthServiceProperties.getAccessTokenExpiresInSeconds());

              return Mono.zip(
                  just(refreshToken),
                  oauthTokenBaseMono,
                  provideAuthenticatedDataMono(just(newRefreshToken), username, secret));
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
   * Given a refresh token mono and the user name, create a "payload" to represent secret data and
   * store it into Redis as a hash and set it to expire in 30 seconds.
   *
   * @param refreshTokenMono refresh token mono
   * @param username username
   * @param someSecret someSecret
   */
  private Mono<Map<String, String>> provideAuthenticatedDataMono(
      Mono<String> refreshTokenMono, String username, String someSecret) {

    var payload = Map.of("username", username, "secret", someSecret);
    var ops = redisTemplate.opsForHash();

    return refreshTokenMono
        .log()
        .doOnNext(
            refreshToken ->
                payload.entrySet().stream()
                    .map(
                        e ->
                            ops.putIfAbsent(
                                redisKeyBlocks.refreshTokenKey(refreshToken),
                                e.getKey(),
                                e.getValue()))
                    .forEach(Mono::subscribe))
        .doOnNext(
            refreshToken ->
                redisTemplate
                    .expireAt(
                        redisKeyBlocks.refreshTokenKey(refreshToken),
                        Instant.now()
                            .plusSeconds(
                                simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds()))
                    .subscribe())
        .flatMap(x -> just(payload));
  }

  private JwtClaims provideJwtClaims(String username, int accessTokenExpiresInSeconds) {

    final var claims = new JwtClaims();
    claims.setGeneratedJwtId();
    claims.setSubject(username);
    claims.setExpirationTimeMinutesInTheFuture(accessTokenExpiresInSeconds / 60.0f);
    return claims;
  }

  private String getKeyIdFromJwks(JsonWebKeySet jwks) {

    return jwks.getJsonWebKeys().stream()
        .filter(jwk -> jwk.getKeyType().equals(RSA))
        .findAny()
        .map(JsonWebKey::getKeyId)
        .orElseThrow();
  }

  private Key getSigningKeyFromJwks(JsonWebKeySet jwks) {

    return jwks.getJsonWebKeys().stream()
        .filter(jwk -> jwk.getKeyType().equals("oct"))
        .findAny()
        .map(JsonWebKey::getKey)
        .map(Key::getEncoded)
        .map(
            bytes -> {
              try {
                return rsaKeyFactory.generatePrivate(new PKCS8EncodedKeySpec(bytes));
              } catch (InvalidKeySpecException e) {
                throw new IllegalStateException(e);
              }
            })
        .orElseThrow();
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

    /**
     * Checks if the refresh token is in a valid format.  Public to expose for testing
     * @param refreshToken refresh token to validate
     * @return true if valid
     */
    public boolean isRefreshTokenValid(String refreshToken) {

        return REFRESH_TOKEN_PATTERN.matcher(refreshToken).matches();
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
     * Provides the refresh token.  Made public to allow testing/
     * @return refresh token mono
     */
  public Mono<String> provideRefreshToken() {

    return fromCallable(
        () -> {
          final byte[] bytes = new byte[31];
          secureRandom.nextBytes(bytes);
          return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        });
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
