package net.trajano.swarm.gateway.datasource.redis;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import net.trajano.swarm.gateway.auth.claims.ZLibStringCompression;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.UserSession;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * This handles the functionality of an Identity Provider (IP). The IP's responsibility is to
 * provide the access token and provide capability to refresh and revoke the token. Provides the
 * token management for the {@link IdentityService}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
    prefix = "auth",
    name = "datasource",
    havingValue = "REDIS",
    matchIfMissing = true)
public class RedisClaimsService implements ClaimsService {

  private final Logger securityLog = LoggerFactory.getLogger("security");

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

  private final IdentityService<?, ?> identityService;

  private final RedisUserSessions redisUserSessions;

  private final RedisStoreAndSignIdentityService redisStoreAndSignIdentityService;

  /**
   * Extracts the JTI from the refresh token sent by the client.
   *
   * @param refreshToken refresh token sent by the client
   * @return a mono with the JTI or error if it is not parsed. An invalid JWT will return empty.
   */
  private Mono<String> extractJti(String refreshToken, HttpHeaders headers) {
    if (!MediaType.APPLICATION_FORM_URLENCODED.equals(headers.getContentType())) {
      return Mono.error(IllegalArgumentException::new);
    }
    if (!refreshToken.matches("[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+")) {
      return Mono.error(IllegalArgumentException::new);
    }
    // The JWT that's reconstituted from the original token
    final var kid = refreshToken.substring(0, refreshToken.indexOf("."));
    final var jwt =
        Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                    ("{\"kid\":\"%s\",\"alg\":\"RS256\"}".formatted(kid))
                        .getBytes(StandardCharsets.US_ASCII))
            + refreshToken.substring(refreshToken.indexOf("."));

    final UUID jwtId;
    try {
      final var nonValidatingConsumer =
          new JwtConsumerBuilder()
              .setRequireExpirationTime()
              .setRequireJwtId()
              .setAllowedClockSkewInSeconds(properties.getAllowedClockSkewInSeconds())
              .setJwsAlgorithmConstraints(
                  AlgorithmConstraints.ConstraintType.PERMIT, AlgorithmIdentifiers.RSA_USING_SHA256)
              .setSkipSignatureVerification()
              .build();
      jwtId = UUID.fromString(nonValidatingConsumer.processToClaims(jwt).getJwtId());
    } catch (InvalidJwtException | MalformedClaimException e) {
      return Mono.error(e);
    }

    return redisUserSessions
        .findById(jwtId)
        .publishOn(refreshTokenScheduler)
        .map(UserSession::getVerificationJwk)
        .map(List::of)
        .map(
            jwks ->
                new JwtConsumerBuilder()
                    .setVerificationKeyResolver(new JwksVerificationKeyResolver(jwks))
                    .setRequireExpirationTime()
                    .setRequireJwtId()
                    .setAllowedClockSkewInSeconds(properties.getAllowedClockSkewInSeconds())
                    .setJwsAlgorithmConstraints(
                        AlgorithmConstraints.ConstraintType.PERMIT,
                        AlgorithmIdentifiers.RSA_USING_SHA256)
                    .build())
        .flatMap(
            consumer -> {
              try {
                return Mono.just(consumer.processToClaims(jwt));
              } catch (InvalidJwtException e) {
                return Mono.empty();
              }
            })
        .flatMap(
            jwtClaims -> {
              try {
                return Mono.just(jwtClaims.getJwtId());
              } catch (MalformedClaimException e) {
                return Mono.error(e);
              }
            });
  }

  @Override
  @Transactional(readOnly = true)
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
                        .setAllowedClockSkewInSeconds(properties.getAllowedClockSkewInSeconds())
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
        .flatMap(t -> getClaims(t.getT1(), t.getT2()))
        .flatMap(
            c -> {
              try {
                return redisUserSessions
                    .findById(UUID.fromString(c.getJwtId()))
                    .switchIfEmpty(Mono.error(SecurityException::new))
                    .thenReturn(c);
              } catch (MalformedClaimException e) {
                return Mono.error(e);
              }
            })
        .switchIfEmpty(Mono.error(SecurityException::new))
        .doOnError(
            SecurityException.class,
            ex -> securityLog.warn("security error obtaining claims: {}", ex.getMessage()));
  }

  private Mono<JwtClaims> getClaims(String jwt, JwtConsumer jwtConsumer) {

    return Mono.fromCallable(
            () -> {
              try {
                return jwtConsumer.processToClaims(jwt);
              } catch (InvalidJwtException e) {
                throw new SecurityException(e);
              }
            })
        .publishOn(jwtConsumerScheduler);
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
  @Transactional
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers) {

    return extractJti(refreshToken, headers)
        .flatMap(jti -> redisUserSessions.findById(UUID.fromString(jti)))
        .flatMap(
            userSession ->
                Mono.zip(
                    identityService.refresh(
                        userSession.getSecretClaims(), userSession.getIssuedOn(), headers),
                    Mono.just(userSession.getJwtId().toString())))
        .flatMap(t -> storeAndSignIdentityServiceResponse(t.getT1(), t.getT2()))
        .map(
            oauthResponse -> AuthServiceResponse.builder().operationResponse(oauthResponse).build())
        .switchIfEmpty(
            Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(
                        new UnauthorizedGatewayResponse("unable to locate the refresh token data"))
                    .statusCode(HttpStatus.UNAUTHORIZED)
                    .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                    .build()))
        .onErrorResume(
            SecurityException.class,
            ex -> {
              securityLog.warn("security error handling refresh request {}", ex.getMessage());
              return Mono.just(
                  AuthServiceResponse.builder()
                      .operationResponse(new UnauthorizedGatewayResponse())
                      .statusCode(HttpStatus.UNAUTHORIZED)
                      .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                      .build());
            })
        .doOnError(ex -> log.error("error processing refresh request", ex))
        .onErrorReturn(
            AuthServiceResponse.builder()
                .operationResponse(new UnauthorizedGatewayResponse())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .build());
  }

  /**
   * Revokes the token. If the token didn't exist, add a 5-second penalty. Regardless if it is
   * present or not, this will return a successful response. Finds the refresh token (the refresh
   * token is stored as is and is queried). The access tokens that are associated with it will be
   * removed if present.
   *
   * @param refreshToken refresh token
   * @param headers ignored headers
   * @return gateway response
   */
  @Override
  @Transactional
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers) {

    return extractJti(refreshToken, headers)
        .flatMap(jti -> redisUserSessions.findById(UUID.fromString(jti)))
        .flatMap(
            userSession ->
                redisUserSessions
                    .delete(userSession)
                    .thenReturn(
                        AuthServiceResponse.builder()
                            .operationResponse(GatewayResponse.builder().ok(true).build())
                            .statusCode(HttpStatus.OK)
                            .build()))
        .switchIfEmpty(
            Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                    .build()));
  }

  /** {@inheritDoc} */
  @Override
  @Transactional
  public Mono<GatewayResponse> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse, String jwtId) {

    if (!identityServiceResponse.isOk()) {
      return Mono.error(IllegalStateException::new);
    }
    return redisStoreAndSignIdentityService
        .storeAndSignIdentityServiceResponse(identityServiceResponse, jwtId, Instant.now())
        .map(
            refreshContext -> {
              var oauthTokenResponse = new OAuthTokenResponse();
              oauthTokenResponse.setOk(true);
              oauthTokenResponse.setAccessToken(refreshContext.getAccessToken());
              oauthTokenResponse.setRefreshToken(refreshContext.getRefreshToken());
              oauthTokenResponse.setTokenType("Bearer");
              oauthTokenResponse.setExpiresIn(
                  Duration.between(Instant.now(), refreshContext.getAccessTokenExpiresAt())
                      .toSeconds());
              return oauthTokenResponse;
            });
  }
}
