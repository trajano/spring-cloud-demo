package net.trajano.swarm.gateway.auth.claims;

import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

public interface ClaimsService {

  /**
   * Extract JWT claims from the bearer token. If the bearer token is invalid, then a
   * Mono.error(SecurityException) will be returned. This checks whether the claims has a valid
   * audience.
   *
   * @param bearerToken bearer token
   * @param clientId client ID which should be part of the audience
   * @return claims
   */
  Mono<JwtClaims> getClaims(String bearerToken, String clientId);

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @param clientId client ID
   * @return updated access token response
   */
  Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers, String clientId);

  /**
   * Revokes the token.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @param clientId client ID
   * @return OK response
   */
  Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers, String clientId);

  /**
   * Stores the data and signs the tokens as needed. It will set the expiration times based on the
   * identity service response as appropriate.
   *
   * @param identityServiceResponse identity service response.
   * @param jwtId JWT ID of the refresh token, may be null if it is a fresh token.
   * @param clientId client ID.
   * @return response suitable for the gateway.
   */
  Mono<GatewayResponse> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse, String jwtId, String clientId);
}
