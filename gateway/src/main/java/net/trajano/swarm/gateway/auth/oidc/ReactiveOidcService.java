package net.trajano.swarm.gateway.auth.oidc;

import java.net.URI;
import org.jose4j.jwt.JwtClaims;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Provides OIDC support services for use with the {@link
 * net.trajano.swarm.gateway.auth.IdentityService}
 */
public interface ReactiveOidcService {

  /**
   * Gets a flux of allowed issuers. This is from a comma separated list of
   * auth.oidc.allowed-issuers
   *
   * @return allowed issuers.
   */
  Flux<URI> allowedIssuers();

  /**
   * This obtains the claims from the issuer.
   *
   * @param issuer issuer
   * @param accessToken access token provided by the IP to get the user info.
   * @return claims
   */
  Mono<JwtClaims> getClaims(URI issuer, String accessToken);
}
