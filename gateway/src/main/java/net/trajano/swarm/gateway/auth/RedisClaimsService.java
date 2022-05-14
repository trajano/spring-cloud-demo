package net.trajano.swarm.gateway.auth;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Random;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.simple.JwtFunctions;
import net.trajano.swarm.gateway.auth.simple.RedisAuthCache;
import net.trajano.swarm.gateway.auth.simple.ZLibStringCompression;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

/**
 * This handles the functionality of an Identity Provider (IP). The IP's responsibility is to
 * provide the access token and provide capability to refresh and revoke the token. Provides the
 * token management for the {@link IdentityService}.
 */
@Component
@RequiredArgsConstructor
public class RedisClaimsService implements ClaimsService {

  private final Scheduler refreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "refreshToken");

  private final JwksProvider jwksProvider;

  private final Scheduler jwtConsumerScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwtConsumer");

  private final AuthProperties properties;

  private final RedisAuthCache redisTokenCache;

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  private final IdentityService<?, ?> identityService;

  private SecureRandom secureRandom;

  private String generateRefreshToken(Random random) {

    final byte[] bytes = new byte[32];
    random.nextBytes(bytes);

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        properties.getRefreshTokenExpiresInSeconds() / 60.0f);
    return jwtClaims.toJson();
  }

  @Override
  public Mono<JwtClaims> getClaims(String accessToken) {

    var jwtConsumerMono =
        jwksProvider
            .jsonWebKeySet()
            .publishOn(jwtConsumerScheduler)
            .map(
                t ->
                    new JwtConsumerBuilder()
                        .setVerificationKeyResolver(
                            new JwksVerificationKeyResolver(t.getJsonWebKeys()))
                        .setRequireSubject()
                        .setRequireExpirationTime()
                        .setRequireJwtId()
                        .setAllowedClockSkewInSeconds(10)
                        .setJwsAlgorithmConstraints(
                            AlgorithmConstraints.ConstraintType.PERMIT,
                            AlgorithmIdentifiers.RSA_USING_SHA256)
                        .build());

    final Mono<String> jwtMono =
        Mono.fromCallable(
                () ->
                    ZLibStringCompression.decompressIfNeeded(
                        accessToken, properties.getJwtSizeLimitInBytes()))
            .publishOn(jwtConsumerScheduler);

    return Mono.zip(jwtMono, jwtConsumerMono)
        .log()
        .flatMap(t -> getClaims(t.getT1(), t.getT2()))
        .log()
        .flatMap(this::validateClaims);
  }

  private Mono<JwtClaims> getClaims(String jwt, JwtConsumer jwtConsumer) {

    return Mono.fromCallable(
            () -> {
              try {
                return jwtConsumer.processToClaims(jwt);
              } catch (InvalidJwtException e) {
                throw new IllegalArgumentException(e);
              }
            })
        .publishOn(jwtConsumerScheduler);
  }

  /**
   * Gets the refresh token redis key from the signed refresh token.
   *
   * @param refreshToken
   * @return
   */
  private Mono<String> getRefreshTokenRedisKey(String refreshToken) {

    return jwksProvider
        .jsonWebKeySet()
        .publishOn(Schedulers.parallel())
        .map(
            jwks ->
                new JwtConsumerBuilder()
                    .setVerificationKeyResolver(
                        new JwksVerificationKeyResolver(jwks.getJsonWebKeys()))
                    .setRequireExpirationTime()
                    .setRequireJwtId()
                    .setAllowedClockSkewInSeconds(10)
                    .setJwsAlgorithmConstraints(
                        AlgorithmConstraints.ConstraintType.PERMIT,
                        AlgorithmIdentifiers.RSA_USING_SHA256)
                    .build())
        .flatMap(
            jwtConsumer -> {
              try {
                return Mono.just(jwtConsumer.processToClaims(refreshToken).toJson());
              } catch (InvalidJwtException e) {
                return Mono.error(e);
              }
            })
        .map(redisKeyBlocks::forRefreshToken);
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void initializeCrypto() {

    try {
      secureRandom = SecureRandom.getInstanceStrong();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @return updated access token response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers) {

    final ReactiveHashOperations<String, String, String> opsForHash = redisTemplate.opsForHash();

    return getRefreshTokenRedisKey(refreshToken)
        .flatMap(
            redisKey ->
                opsForHash
                    .multiGet(redisKey, List.of("jti", "secret"))
                    .flatMap(
                        redisItems ->
                            redisTemplate
                                .delete(
                                    redisKeyBlocks.accessTokenJtiKey(redisItems.get(0)), redisKey)
                                .thenReturn(redisItems.get(1))))
        .flatMap(
            secretClaimsJson -> {
              try {
                return Mono.just(JwtClaims.parse(secretClaimsJson));
              } catch (InvalidJwtException e) {
                return Mono.error(e);
              }
            })
        .flatMap(secretClaims -> identityService.refresh(secretClaims, headers))
        .cast(IdentityServiceResponse.class)
        .flatMap(this::storeAndSignIdentityServiceResponse)
        .map(
            oauthResponse -> AuthServiceResponse.builder().operationResponse(oauthResponse).build())
        .onErrorReturn(
            AuthServiceResponse.builder()
                .operationResponse(new UnauthorizedGatewayResponse())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                .build());
  }

  @Override
  public Mono<GatewayResponse> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse) {

    return Mono.zip(
        args -> {
          var claims = ((Tuple2<JwtClaims, String>) args[0]).getT1();
          var unsignedRefreshTokenJson = ((Tuple2<JwtClaims, String>) args[0]).getT2();
          var jwks = (JsonWebKeySet) args[1];
          String accessToken = JwtFunctions.sign(jwks, claims.toJson());
          if (properties.isCompressClaims()) {
            accessToken = ZLibStringCompression.compress(accessToken);
          }

          final String refreshToken = JwtFunctions.sign(jwks, unsignedRefreshTokenJson);
          var oauthTokenResponse = new OAuthTokenResponse();
          oauthTokenResponse.setOk(true);
          oauthTokenResponse.setAccessToken(accessToken);
          oauthTokenResponse.setRefreshToken(refreshToken);
          oauthTokenResponse.setTokenType("Bearer");
          oauthTokenResponse.setExpiresIn(properties.getAccessTokenExpiresInSeconds());
          return oauthTokenResponse;
        },
        storeIdentityServiceResponse(identityServiceResponse),
        jwksProvider.getSigningKey(properties.getAccessTokenExpiresInSeconds()));
  }

  /**
   *
   *
   * <ol>
   *   <li>The client claims are modified so that it has a JTI, Expiration and other system claims
   *       added.
   *   <li>split
   *       <ul>
   *         <li>secret
   *             <ol>
   *               <li>The secrets are modified so that it has JTI from the client claims.
   *               <li>This generates a new refresh token.
   *               <li>The secrets are stored into refresh-tokens redis.
   *             </ol>
   *         <li>The client claims are signed
   *       </ul>
   *   <li>access token JTI is stored in another redis cache (used for revocations)
   * </ol>
   *
   * @return
   */
  private Mono<Tuple2<JwtClaims, String>> storeIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse) {

    final ReactiveValueOperations<String, String> opsForValue = redisTemplate.opsForValue();
    final ReactiveHashOperations<String, String, String> opsForHash = redisTemplate.opsForHash();
    return withSystemClaims(identityServiceResponse.getClaims())
        .flatMap(
            claims -> {
              try {
                final String refreshToken = generateRefreshToken(secureRandom);
                final String refreshTokenRedisKey = redisKeyBlocks.forRefreshToken(refreshToken);
                final String jwtId = claims.getJwtId();

                return Mono.ignoreElements(
                        Mono.just(identityServiceResponse.getSecretClaims())
                            .map(JwtClaims::toJson)
                            .flatMap(
                                secretClaimsJson ->
                                    opsForHash.putAll(
                                        refreshTokenRedisKey,
                                        Map.of("secret", secretClaimsJson, "jti", jwtId)))
                            .filter(success -> success)
                            .flatMap(
                                ig ->
                                    opsForValue.set(redisKeyBlocks.accessTokenJtiKey(jwtId), jwtId))
                            .filter(success -> success)
                            .switchIfEmpty(Mono.error(IllegalStateException::new)))
                    .thenReturn(Tuples.of(claims, refreshToken));
              } catch (MalformedClaimException e) {
                return Mono.error(e);
              }
            });
  }

  /**
   * Checks if the JwtId is still valid
   *
   * @param jwtClaims claims
   * @return claims as is if valid.
   */
  private Mono<JwtClaims> validateClaims(JwtClaims jwtClaims) {

    try {
      final String jwtId = jwtClaims.getJwtId();
      return isJwtIdValid(jwtId)
          .log()
          .filter(isValid -> isValid)
          .switchIfEmpty(
              Mono.error(
                  new SecurityException(
                      "unable to find redis key %s"
                          .formatted(redisKeyBlocks.accessTokenJtiKey(jwtId)))))
          .map(ignored -> jwtClaims);
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }
  }

  private Mono<Boolean> isJwtIdValid(String jwtId) {

    return redisTemplate.hasKey(redisKeyBlocks.accessTokenJtiKey(jwtId));
  }

  private Mono<JwtClaims> withJti(String jti, JwtClaims sourceClaims) {

    try {
      final var claims = JwtClaims.parse(sourceClaims.toJson());
      claims.setJwtId(jti);
      return Mono.just(claims);
    } catch (InvalidJwtException e) {
      return Mono.error(e);
    }
  }

  private Mono<JwtClaims> withSystemClaims(JwtClaims sourceClaims) {

    try {
      final var claims = JwtClaims.parse(sourceClaims.toJson());
      claims.setGeneratedJwtId();
      claims.setIssuer(properties.getIssuer());

      claims.setExpirationTimeMinutesInTheFuture(
          properties.getAccessTokenExpiresInSeconds() / 60.0f);
      return Mono.just(claims);
    } catch (InvalidJwtException e) {
      return Mono.error(e);
    }
  }

  /**
   * Revokes the token. If the token didn't exist, add a 5-second penalty.
   *
   * @param refreshToken refresh token
   * @param headers ignored headers
   * @return gateway response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers) {

    final ReactiveHashOperations<String, String, String> ops = redisTemplate.opsForHash();
    return getRefreshTokenRedisKey(refreshToken)
        .flatMap(
            refreshTokenRedisKey ->
                ops.get(refreshTokenRedisKey, "jti")
                    .flatMap(jti -> redisTemplate.delete(redisKeyBlocks.accessTokenJtiKey(jti)))
                    .defaultIfEmpty(0L)
                    .flatMap(ignored -> redisTemplate.delete(refreshTokenRedisKey)))
        .filter(deleteCount -> deleteCount == 1)
        .map(
            ignored ->
                AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .build())
        .switchIfEmpty(
            Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                    .build()));
  }
}
