package net.trajano.swarm.gateway.auth.simple;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.OAuthRefreshRequest;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.jose4j.lang.JoseException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@RequiredArgsConstructor
@Slf4j
public class SimpleIdentityService<P>
    implements IdentityService<SimpleAuthenticationRequest, GatewayResponse, P> {

  public static final String X_JWT_ASSERTION = "X-JWT-Assertion";

  public static final String X_JWT_AUDIENCE = "X-JWT-Audience";

  private final SimpleAuthServiceProperties properties;

  private final RedisAuthCache redisTokenCache;

  private final Scheduler jwtConsumerScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwtConsumer");

  /**
   * {@inheritDoc} Performs an authentication check. If {@link
   * SimpleAuthenticationRequest#isAuthenticated()} is {@code true} then the user is authenticated.
   * If the user is unauthenticated, it generates a penalty delay.
   *
   * <p>If successful, a "secret" which is basically a random UUID is created and associated with
   * the login. This could be some form of credential or any other thing that would allow {@link
   * net.trajano.swarm.gateway.auth.AbstractAuthController#refreshUrlEncoded(OAuthRefreshRequest,
   * ServerWebExchange)} to create another authentication token.
   *
   * <p>Here's the sequence.
   *
   * <ol>
   *   <li>authenticationRequest + jwks
   *   <li>JWT(jti + authenticationRequest.username) ::: secret
   *   <li>unsigned access token (as JSON string) ::: unsigned refresh token
   *   <li>access token ::: refresh token
   *   <li>oauth token
   * </ol>
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> authenticate(
      Mono<SimpleAuthenticationRequest> authenticationRequestMono, HttpHeaders headers) {

    return authenticationRequestMono
        .filter(SimpleAuthenticationRequest::isAuthenticated)
        .switchIfEmpty(Mono.error(SecurityException::new))
        .map(
            authenticationRequest ->
                AuthenticationItem.builder().authenticationRequest(authenticationRequest).build())
        .map(redisTokenCache::provideClaimsAndSecret)
        .flatMap(redisTokenCache::provideClaimsJsonAndUnsignedRefreshToken)
        .flatMap(redisTokenCache::provideAccessTokenAndRefreshToken)
        .map(redisTokenCache::provideOAuthToken)
        .map(token -> AuthServiceResponse.builder().operationResponse(token).build())
        .onErrorReturn(
            AuthServiceResponse.builder()
                .operationResponse(
                    GatewayResponse.builder().ok(false).error("authentication_failed").build())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                .build());
  }

  /**
   * @param accessToken access token which is a JWE
   * @return claims
   */
  @Override
  public Mono<JwtClaims> getClaims(String accessToken) {

    var jwtConsumerMono =
        jsonWebKeySet()
            .map(
                jwks ->
                    new JwtConsumerBuilder()
                        .setVerificationKeyResolver(
                            new JwksVerificationKeyResolver(jwks.getJsonWebKeys()))
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
            .publishOn(Schedulers.boundedElastic());

    return Mono.zip(jwtMono, jwtConsumerMono)
        .flatMap(t -> getClaims(t.getT1(), t.getT2()))
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

  @Override
  public Mono<P> getProfile(String accessToken) {

    return null;
  }

  public Mono<String> getRefreshTokenKey(String refreshToken) {

    return jsonWebKeySet()
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
        .map(
            jwtConsumer -> {
              try {
                return jwtConsumer.processToClaims(refreshToken).toJson();
              } catch (InvalidJwtException e) {
                throw new SecurityException(e);
              }
            });
  }

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return redisTokenCache.jwks().collectList().map(JsonWebKeySet::new);
  }

  @Override
  public ServerWebExchange mutateDownstreamRequest(
      ServerWebExchange exchange, JwtClaims jwtClaims) {

    final String jwtAssertion;
    final String audience;

    try {
      final var jws = new JsonWebSignature();
      jws.setAlgorithmConstraints(AlgorithmConstraints.ALLOW_ONLY_NONE);
      jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.NONE);
      jws.setPayload(jwtClaims.toJson());
      jws.sign();
      jwtAssertion = jws.getCompactSerialization();
      audience = String.join(",", jwtClaims.getAudience());
    } catch (MalformedClaimException | JoseException e) {
      throw new IllegalArgumentException(e);
    }
    return exchange
        .mutate()
        .request(
            exchange
                .getRequest()
                .mutate()
                .header(X_JWT_ASSERTION, jwtAssertion)
                .header(X_JWT_AUDIENCE, audience)
                .build())
        .build();
  }

  /**
   * Here's the sequence.
   *
   * <ol>
   *   <li>refresh token
   *   <li>unsigned refresh token
   *   <li>secret
   *   <li>new JWT(jti + secret.username) ::: new secret
   *   <li>unsigned access token (as JSON string) ::: new unsigned refresh token
   *   <li>new access token ::: new refresh token
   *   <li>new oauth token
   * </ol>
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers
   * @return refresh response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers) {

    return getRefreshTokenKey(refreshToken)
        .map(
            unsignedRefereshToken ->
                AuthenticationItem.builder().refreshToken(unsignedRefereshToken).build())
        .flatMap(redisTokenCache::populateSecretFromRefreshToken)
        .map(redisTokenCache::populateClaimsFromSecret)
        .flatMap(redisTokenCache::provideClaimsJsonAndUnsignedRefreshToken)
        .flatMap(redisTokenCache::provideAccessTokenAndRefreshToken)
        .map(redisTokenCache::provideOAuthToken)
        .map(token -> AuthServiceResponse.builder().operationResponse(token).build())
        .onErrorReturn(
            AuthServiceResponse.builder()
                .operationResponse(new UnauthorizedGatewayResponse())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                .build());
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

    return getRefreshTokenKey(refreshToken)
        .flatMap(redisTokenCache::revoke)
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

  /**
   * Checks if the JwtId is still valid
   *
   * @param jwtClaims claims
   * @return claims as is if valid.
   */
  private Mono<JwtClaims> validateClaims(JwtClaims jwtClaims) {
    try {
      return redisTokenCache
          .isJwtIdValid(jwtClaims.getJwtId())
          .filter(isValid -> isValid)
          .switchIfEmpty(Mono.error(SecurityException::new))
          .map(ignored -> jwtClaims);
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }
  }
}
