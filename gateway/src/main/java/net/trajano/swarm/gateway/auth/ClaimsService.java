package net.trajano.swarm.gateway.auth;

import net.trajano.swarm.gateway.web.GatewayResponse;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

public interface ClaimsService {

  /**
   * Extract JWT claims from the bearer token.
   *
   * @param bearerToken
   * @return
   */
  Mono<JwtClaims> getClaims(String bearerToken);

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @return updated access token response
   */
  Mono<AuthServiceResponse<GatewayResponse>> refresh(String refreshToken, HttpHeaders headers);

  Mono<AuthServiceResponse<GatewayResponse>> revoke(String refreshToken, HttpHeaders headers);

  Mono<GatewayResponse> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse);
}
