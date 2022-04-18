package net.trajano.swarm.gateway.auth;

import org.jose4j.jwt.JwtClaims;

/**
 * @param <A> authentication request
 * @param <R> response
 * @param <P> profile response
 */
public interface AuthService<A, R, P> {

  R authenticate(A authenticationRequest);

  R refresh(String refreshToken);

  P getProfile(String accessToken);

  JwtClaims getClaims(String accessToken);

  void revoke(String refreshToken);
}
