package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

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

  private final JwksProvider jwksProvider;

  private final Scheduler jwtConsumerScheduler;

  private final AuthProperties properties;

  private final IdentityService<?, ?> identityService;

  private final RedisUserSessions redisUserSessions;

  private final RedisStoreAndSignIdentityService redisStoreAndSignIdentityService;

  private final RedisJtiExtractorService redisJtiExtractorService;

  @Autowired
  @Qualifier("penalty") private Scheduler penaltyScheduler;

  /**
   * Builds a valid OAuth token response
   *
   * @param accessToken access token JWT
   * @param refreshToken refresh token JWT
   * @param accessTokenExpiresAt when the access token is going to expire. *
   * @return valid OAuth token response.
   */
  private OAuthTokenResponse buildValidOAuthTokenResponse(
      String accessToken, String refreshToken, Instant accessTokenExpiresAt) {

    var oauthTokenResponse = new OAuthTokenResponse();
    oauthTokenResponse.setOk(true);
    oauthTokenResponse.setAccessToken(accessToken);
    oauthTokenResponse.setRefreshToken(refreshToken);
    oauthTokenResponse.setTokenType("Bearer");
    oauthTokenResponse.setExpiresIn(
        ChronoUnit.SECONDS.between(Instant.now(), accessTokenExpiresAt));
    return oauthTokenResponse;
  }

  /**
   * Extracts the JTI from the refresh token sent by the client.
   *
   * @param refreshToken refresh token sent by the client
   * @param headers HTTP headers
   * @param clientId client ID
   * @return a mono with the JTI or error if it is not parsed. An invalid JWT will return empty.
   */
  private Mono<String> extractJti(String refreshToken, HttpHeaders headers, String clientId) {

    if (!MediaType.APPLICATION_FORM_URLENCODED.equals(headers.getContentType())) {
      return Mono.error(IllegalArgumentException::new);
    }
    if (!refreshToken.matches("[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+")) {
      return Mono.error(IllegalArgumentException::new);
    }
    return redisJtiExtractorService.extractJti(refreshToken, clientId);
  }

  private Mono<JwtClaims> getClaims(String jwt, JwtConsumer jwtConsumer) {

    return Mono.fromCallable(
            () -> {
              final var start = System.currentTimeMillis();
              try {
                log.error("jwt={}", jwt);
                return jwtConsumer.processToClaims(jwt);
              } catch (InvalidJwtException e) {
                throw new SecurityException(e);
              } finally {
                final long l = System.currentTimeMillis() - start;
                if (l > 500) {
                  log.error("Access Token Signature validation time {}ms > 500ms ", l);
                } else if (l > 100) {
                  log.warn("Access Token Signature validation time {}ms > 100ms ", l);
                }
              }
            })
        .publishOn(jwtConsumerScheduler);
  }

  @Override
  @Transactional(readOnly = true)
  public Mono<JwtClaims> getClaims(String accessToken) {

    var jwtConsumerMono =
        jwksProvider
            .jsonWebKeySet()
            .map(
                t ->
                    new JwtConsumerBuilder()
                        .setVerificationKeyResolver(
                            new JwksVerificationKeyResolver(t.getJsonWebKeys()))
                        .setRequireSubject()
                        .setRequireExpirationTime()
                        .setRequireJwtId()
                        .setExpectedAudience(true, properties.getIssuer())
                        .setAllowedClockSkewInSeconds(properties.getAllowedClockSkewInSeconds())
                        .setJwsAlgorithmConstraints(
                            AlgorithmConstraints.ConstraintType.PERMIT,
                            AlgorithmIdentifiers.ECDSA_USING_P256_CURVE_AND_SHA256)
                        .build());

    final Mono<String> jwtMono =
        Mono.fromCallable(
            () ->
                ZLibStringCompression.decompressIfNeeded(
                    accessToken, properties.getJwtSizeLimitInBytes()));

    return Mono.zip(jwtMono, jwtConsumerMono)
        .flatMap(t -> getClaims(t.getT1(), t.getT2()))
        .flatMap(
            c -> {
              try {
                return redisUserSessions
                    .findById(c.getJwtId())
                    .switchIfEmpty(Mono.error(SecurityException::new))
                    .map(i -> c);
              } catch (MalformedClaimException e) {
                return Mono.error(e);
              }
            })
        .switchIfEmpty(Mono.error(SecurityException::new))
        .doOnError(
            SecurityException.class,
            ex -> securityLog.warn("security error obtaining claims: {}", ex.getMessage()));
  }

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @param clientId client ID
   * @return updated access token response
   */
  @Override
  @Transactional
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers, String clientId) {

    return extractJti(refreshToken, headers, clientId)
        .flatMap(jti -> redisUserSessions.findById(jti))
        .flatMap(userSession -> refreshIfNeeded(userSession, headers, clientId))
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
   * This will perform the refresh operation if needed. So if the age of the token is not going to
   * expire it will not perform the expensive call back to the identity service nor sign.
   *
   * @param userSession user session
   * @param headers headers
   * @param clientId client ID
   * @return gateway response
   */
  private Mono<? extends GatewayResponse> refreshIfNeeded(
      UserSession userSession, HttpHeaders headers, String clientId) {

    if (ChronoUnit.MILLIS.between(userSession.getAccessTokenIssuedOn(), Instant.now())
        < properties.getMinimumAccessTokenAgeBeforeRefreshInMillis()) {
      return Mono.just(
              buildValidOAuthTokenResponse(
                  userSession.getAccessToken(),
                  userSession.getRefreshToken(),
                  userSession.getAccessTokenExpiresAt()))
          .delayElement(
              Duration.of(properties.getPenaltyDelayInMillis(), ChronoUnit.MILLIS),
              penaltyScheduler);
    }

    // if access token is old enough
    return identityService
        .refresh(userSession.getSecretClaims(), userSession.getIssuedOn(), headers)
        .flatMap(
            identityServiceResponse ->
                storeAndSignIdentityServiceResponse(
                    identityServiceResponse, userSession.getJwtId().toString(), clientId));
  }

  /**
   * Revokes the token. If the token didn't exist, add a 5-second penalty. Regardless if it is
   * present or not, this will return a successful response. Finds the refresh token (the refresh
   * token is stored as is and is queried). The access tokens that are associated with it will be
   * removed if present.
   *
   * @param refreshToken refresh token
   * @param headers ignored headers
   * @param clientId client ID
   * @return gateway response
   */
  @Override
  @Transactional
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers, String clientId) {

    return extractJti(refreshToken, headers, clientId)
        .flatMap(jti -> redisUserSessions.findById(jti))
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
      IdentityServiceResponse identityServiceResponse, String jwtId, String clientId) {

    if (!identityServiceResponse.isOk()) {
      return Mono.error(IllegalStateException::new);
    }
    return redisStoreAndSignIdentityService
        .storeAndSignIdentityServiceResponse(
            identityServiceResponse, jwtId, Instant.now(), clientId)
        .map(
            refreshContext ->
                buildValidOAuthTokenResponse(
                    refreshContext.getAccessToken(),
                    refreshContext.getRefreshToken(),
                    refreshContext.getAccessTokenExpiresAt()));
  }
}
