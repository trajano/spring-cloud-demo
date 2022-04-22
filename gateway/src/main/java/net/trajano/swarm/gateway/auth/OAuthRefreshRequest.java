package net.trajano.swarm.gateway.auth;

import lombok.Data;

@Data
public class OAuthRefreshRequest {

    /**
     * Refresh token.  Used non-conventional method due to limitation of Spring.  https://github.com/spring-projects/spring-framework/issues/18012
     */
    private String refresh_token;
    /**
     * Grant type, should be refresh_token.  Used non-conventional method due to limitation of Spring.  https://github.com/spring-projects/spring-framework/issues/18012
     */
    private String grant_type;

}
