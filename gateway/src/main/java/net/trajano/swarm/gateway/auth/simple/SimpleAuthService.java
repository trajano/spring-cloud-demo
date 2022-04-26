package net.trajano.swarm.gateway.auth.simple;

import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.AuthService;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RequiredArgsConstructor
public class SimpleAuthService<P>
    implements AuthService<SimpleAuthenticationRequest, GatewayResponse, P> {

  private final SimpleAuthServiceProperties properties;

  private final RedisAuthCache redisTokenCache;

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> authenticate(
      Mono<SimpleAuthenticationRequest> authenticationRequestMono,  HttpHeaders headers) {

    return authenticationRequestMono.map(
        authenticationRequest -> {
          if (authenticationRequest.isAuthenticated()) {
            final var operationResponse = new OAuthTokenResponse();
            operationResponse.setOk(true);
            operationResponse.setExpiresIn(properties.getAccessTokenExpiresInSeconds());
            return AuthServiceResponse.builder().operationResponse(operationResponse).build();

          } else {

            return AuthServiceResponse.builder()
                .operationResponse(new UnauthorizedGatewayResponse())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .delay(Duration.of(2, ChronoUnit.SECONDS))
                .build();
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
   * @return
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
}
