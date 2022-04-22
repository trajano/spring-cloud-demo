package net.trajano.swarm.gateway.auth;

import org.jose4j.jwt.JwtClaims;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SimpleAuthService<A, R, P> implements AuthService<A, R, P> {

    @Override
    public AuthServiceResponse<R> authenticate(A authenticationRequest, Map<String, String> headers) {

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

        return null;

    }

    @Override
    public AuthServiceResponse<R> revoke(String refreshToken, Map<String, String> headers) {

        return null;

    }

}
