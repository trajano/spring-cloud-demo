package net.trajano.swarm.gateway.auth;

import java.util.Map;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * @param <A> authentication request
 * @param <R> response that extends OAuthResponse so additional data can be embedded.
 * @param <P> profile response
 */
public interface AuthService<A, R extends GatewayResponse, P> {

  /**
   * Authenticates the user based on the request.
   *
   * @param authenticationRequest authentication request
   * @param headers HTTP headers
   * @return access token response
   */
  Mono<AuthServiceResponse<R>> authenticate(Mono<A> authenticationRequest, HttpHeaders headers);

  Mono<JsonWebKeySet> jsonWebKeySet();

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers
   * @return updated access token response
   */
  Mono<AuthServiceResponse<R>> refresh(String refreshToken, Map<String, String> headers);

  Mono<P> getProfile(String accessToken);

  /**
   * Gets the claims from the access token. May throw a {@link SecurityException} if the access
   * token is not valid. This does not return null.
   *
   * @param accessToken access token
   * @return claims.
   */
  Mono<JwtClaims> getClaims(String accessToken);

  /**
   * Called by the filter to give an opportunity to mutate the exchange with information from the
   * claims. May throw a {@link SecurityException} if there is any processing issue.
   *
   * @param exchange server web exchange to mutate
   * @param jwtClaims JWT claims that were obtained.
   */
  default ServerWebExchange mutateDownstreamRequest(
      ServerWebExchange exchange, JwtClaims jwtClaims) {

    return exchange;
  }

  /**
   * Revokes the token also known as logout.
   *
   * @param refreshToken
   * @param headers
   */
  Mono<AuthServiceResponse<R>> revoke(String refreshToken, Map<String, String> headers);
}
