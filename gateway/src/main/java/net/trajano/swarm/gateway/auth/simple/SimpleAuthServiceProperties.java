package net.trajano.swarm.gateway.auth.simple;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties("simple-auth")
@Data
public class SimpleAuthServiceProperties {

    private boolean enabled;
    /**
     * Access token time expires in seconds.  This is kept low to make it easier to test.
     */
    private int accessTokenExpiresInSeconds = 120;

    /**
     * Refresh token time expires in seconds.  This is kept low to make it easier to test.
     */
    private int refreshTokenExpiresInSeconds = 1200;

    /**
     * Prefix for keys.
     */
    private String redisPrefix = "simple-auth/";
}
