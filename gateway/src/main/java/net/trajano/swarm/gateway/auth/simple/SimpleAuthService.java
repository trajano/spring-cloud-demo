package net.trajano.swarm.gateway.auth.simple;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.AuthService;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class SimpleAuthService<P>
    implements AuthService<SimpleAuthenticationRequest, GatewayResponse, P> {

  private final SimpleAuthServiceProperties properties;

  private final RedisAuthCache redisTokenCache;

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> authenticate(
      Mono<SimpleAuthenticationRequest> authenticationRequestMono, HttpHeaders headers) {

    return authenticationRequestMono.flatMap(
        authenticationRequest -> {
          if (authenticationRequest.isAuthenticated()) {
            return redisTokenCache
                .buildOAuthTokenWithUsername(
                    authenticationRequest.getUsername(),
                    properties.getAccessTokenExpiresInSeconds())
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
      String refreshToken, Map<String, String> headers) {

    return null;
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

    return Mono.just(new JwtClaims());
  }

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, Map<String, String> headers) {

    return null;
  }

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return redisTokenCache.jwks().collectList().map(JsonWebKeySet::new);
  }
}
