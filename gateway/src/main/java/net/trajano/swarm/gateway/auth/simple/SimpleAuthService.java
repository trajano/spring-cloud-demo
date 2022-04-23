package net.trajano.swarm.gateway.auth.simple;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.AuthService;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import org.jose4j.jwt.JwtClaims;

@RequiredArgsConstructor
public class SimpleAuthService<R extends OAuthTokenResponse, P>
    implements AuthService<SimpleAuthenticationRequest, R, P> {

  private final SimpleAuthServiceProperties properties;

  @Override
  public AuthServiceResponse<R> authenticate(
      SimpleAuthenticationRequest authenticationRequest, Map<String, String> headers) {
    //
    //    if (authenticationRequest.isAuthenticated()) {
    //      return AuthServiceResponse.builder()
    //              .operationResponse(new UnauthorizedGatewayResponse())
    //              .build();
    //
    //    } else {
    //
    //      return       AuthServiceResponse.builder()
    //               .operationResponse(new UnauthorizedGatewayResponse())
    //               .statusCode(HttpStatus.UNAUTHORIZED)
    //               .delay(Duration.of(2, ChronoUnit.SECONDS))
    //               .build();
    //
    //    }
    return null;
  }

  @Override
  public AuthServiceResponse<R> refresh(String refreshToken, Map<String, String> headers) {

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
  public AuthServiceResponse<R> revoke(String refreshToken, Map<String, String> headers) {

    return null;
  }
}
