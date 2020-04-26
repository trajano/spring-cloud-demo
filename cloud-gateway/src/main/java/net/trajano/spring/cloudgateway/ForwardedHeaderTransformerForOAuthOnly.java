package net.trajano.spring.cloudgateway;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;

public class ForwardedHeaderTransformerForOAuthOnly extends ForwardedHeaderTransformer {
    @Override
    public ServerHttpRequest apply(ServerHttpRequest request) {

        System.out.println(">>>> " + request.getPath().value());
        if (isOauth(request)) {
            System.out.println(">>>> IS OAUTH");
            return super.apply(request);
        }
        return request;
        //return super.apply(request);
    }

    private boolean isOauth(ServerHttpRequest request) {
        return request.getPath().value().startsWith("/oauth2/authorization/") || request.getPath().value().startsWith("/login/oauth2/code/");
    }
}
