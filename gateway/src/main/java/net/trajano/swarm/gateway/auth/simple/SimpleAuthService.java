package net.trajano.swarm.gateway.auth.simple;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.AuthService;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
public class SimpleAuthService<P>
    implements AuthService<SimpleAuthenticationRequest, GatewayResponse, P> {

  private final SimpleAuthServiceProperties properties;

  @Override
  public AuthServiceResponse<GatewayResponse> authenticate(
      SimpleAuthenticationRequest authenticationRequest, Map<String, String> headers) {

    if (authenticationRequest.isAuthenticated()) {
      return AuthServiceResponse.builder()
          .operationResponse(new UnauthorizedGatewayResponse())
          .build();

    } else {

      return AuthServiceResponse.builder()
          .operationResponse(new UnauthorizedGatewayResponse())
          .statusCode(HttpStatus.UNAUTHORIZED)
          .delay(Duration.of(2, ChronoUnit.SECONDS))
          .build();
    }
  }

  @Override
  public AuthServiceResponse<GatewayResponse> refresh(
      String refreshToken, Map<String, String> headers) {

    return null;
  }

  @Override
  public P getProfile(String accessToken) {

    return null;
  }

  @Override
  public JwtClaims getClaims(String accessToken) {

    return new JwtClaims();
  }

  @Override
  public AuthServiceResponse<GatewayResponse> revoke(
      String refreshToken, Map<String, String> headers) {

    return null;
  }
}
