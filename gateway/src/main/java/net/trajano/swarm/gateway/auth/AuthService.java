package net.trajano.swarm.gateway.auth;

import org.jose4j.jwt.JwtClaims;

import java.util.Map;

/**
 * @param <A> authentication request
 * @param <R> response
 * @param <P> profile response
 */
public interface AuthService<A, R, P> {

    /**
     * Authenticates the user based on the request.  May throw a {@link SecurityException} if the user is not authorized.
     *
     * @param authenticationRequest authentication request
     * @param headers               HTTP headers
     * @return access token response
     */
    AuthServiceResponse<R> authenticate(A authenticationRequest, Map<String, String> headers);

    /**
     * Refreshes the token and returns a new authentication response.  May throw a {@link IllegalArgumentException} if the
     * token is not valid or expired.
     *
     * @param refreshToken refresh token
     * @param headers      HTTP headers
     * @return updated access token response
     */
    AuthServiceResponse<R> refresh(String refreshToken, Map<String, String> headers);

    P getProfile(String accessToken);

    JwtClaims getClaims(String accessToken);

    /**
     * Revokes the token also known as logout.
     *
     * @param refreshToken
     * @param headers
     */
    AuthServiceResponse<R> revoke(String refreshToken, Map<String, String> headers);

}
