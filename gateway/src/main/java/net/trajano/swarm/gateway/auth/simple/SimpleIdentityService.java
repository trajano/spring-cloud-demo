package net.trajano.swarm.gateway.auth.simple;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
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
import org.jose4j.jwt.consumer.*;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.jose4j.lang.JoseException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class SimpleIdentityService<P>
    implements IdentityService<SimpleAuthenticationRequest, GatewayResponse, P> {

  public static final String X_JWT_ASSERTION = "X-JWT-Assertion";

  public static final String X_JWT_AUDIENCE = "X-JWT-Audience";

  private final SimpleAuthServiceProperties properties;

  private final RedisAuthCache redisTokenCache;

  /**
   * {@inheritDoc} Performs an authentication check. If {@link
   * SimpleAuthenticationRequest#authenticated} is {@code true} then the user is authenticated. If
   * the user is unauthenticated, it generates a penalty delay.
   *
   * <p>If successful, a "secret" which is basically a random UUID is created and associated with
   * the login. This could be some form of credential or any other thing that would allow {@link
   * net.trajano.swarm.gateway.auth.AbstractAuthController#refreshUrlEncoded(OAuthRefreshRequest,
   * ServerWebExchange)} to create another authentication token.
   *
   * <p>That data is stored as a string map on an {@link
   * net.trajano.swarm.gateway.auth.AuthCredentialStorage} that allows signing key retrieval and
   * retrieval by refresh token.
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> authenticate(
      Mono<SimpleAuthenticationRequest> authenticationRequestMono, HttpHeaders headers) {

    return authenticationRequestMono.flatMap(
        authenticationRequest -> {
          if (authenticationRequest.isAuthenticated()) {
            return redisTokenCache
                .provideOAuthTokenWithUserName(authenticationRequest.getUsername())
                .map(token -> AuthServiceResponse.builder().operationResponse(token).build());

          } else {

            return Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(new UnauthorizedGatewayResponse())
                    .statusCode(HttpStatus.UNAUTHORIZED)
                    .delay(Duration.of(5, ChronoUnit.SECONDS))
                    .build());
          }
        });
  }

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers) {

    return redisTokenCache
        .provideRefreshedOAuthToken(refreshToken)
        .map(response -> AuthServiceResponse.builder().operationResponse(response).build())
        .switchIfEmpty(
            Mono.just(
                AuthServiceResponse.builder()
                    .statusCode(HttpStatus.UNAUTHORIZED)
                    .operationResponse(new UnauthorizedGatewayResponse())
                    .delay(Duration.of(5, ChronoUnit.SECONDS))
                    .build()));
  }

  @Override
  public Mono<P> getProfile(String accessToken) {

    return null;
  }

  /**
   * @param accessToken access token which is a JWE
   * @return claims
   */
  @Override
  public Mono<JwtClaims> getClaims(String accessToken) {

    final String jwt;
    if (properties.isCompressClaims()) {
      jwt = ZLibStringCompression.decompress(accessToken, properties.getJwtSizeLimitInBytes());
    } else {
      jwt = accessToken;
    }
    return jsonWebKeySet()
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
                        AlgorithmIdentifiers.RSA_USING_SHA512)
                    .build())
        .flatMap(jwtConsumer -> getClaims(jwt, jwtConsumer));
  }

  private Mono<JwtClaims> getClaims(String jwt, JwtConsumer jwtConsumer) {

    try {
      return Mono.just(jwtConsumer.processToClaims(jwt));
    } catch (InvalidJwtException e) {
      return Mono.error(e);
    }
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
   * Revokes the token. If the token didn't exist, add a 5-second penalty.
   *
   * @param refreshToken refresh token
   * @param headers ignored headers
   * @return gateway response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers) {

    return redisTokenCache
        .revoke(refreshToken)
        .map(
            deleteCount -> {
              if (deleteCount == 1) {
                return AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .build();

              } else {
                return AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .delay(Duration.of(5, ChronoUnit.SECONDS))
                    .build();
              }
            });
  }

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return redisTokenCache.jwks().collectList().map(JsonWebKeySet::new);
  }
}
