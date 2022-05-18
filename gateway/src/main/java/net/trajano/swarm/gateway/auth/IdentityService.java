package net.trajano.swarm.gateway.auth;

import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import org.jose4j.jwt.JwtClaims;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This interface handles provides a bridge to a backend that will handle the authentication and
 * handle any mutations to service requests that are specific to the application (may move that to
 * another class later). It does not deal with OAuth tokens as that is done by {@link
 * ClaimsService}.
 *
 * @param <A> authentication request
 * @param <P> profile response
 */
public interface IdentityService<A, P> {

  /**
   * Authenticates the user based on the request.
   *
   * @param authenticationRequest authentication request
   * @param headers HTTP headers
   * @return access token response
   */
  Mono<IdentityServiceResponse> authenticate(A authenticationRequest, HttpHeaders headers);

  Mono<IdentityServiceResponse> refresh(JwtClaims secretClaims, HttpHeaders headers);

  /**
   * This will be moved to another class what performs the consumption as it's not part of the IP.
   *
   * @param accessToken
   * @return
   */
  Mono<P> getProfile(String accessToken);

  /**
   * Called by the filter to give an opportunity to mutate the exchange with information from the
   * claims. May throw a {@link SecurityException} if there is any processing issue. This will be
   * moved to another class what performs the consumption as it's not part of the IP.
   *
   * @param exchange server web exchange to mutate
   * @param jwtClaims JWT claims that were obtained.
   */
  default ServerWebExchange mutateDownstreamRequest(
      ServerWebExchange exchange, JwtClaims jwtClaims) {

    return exchange;
  }
}
