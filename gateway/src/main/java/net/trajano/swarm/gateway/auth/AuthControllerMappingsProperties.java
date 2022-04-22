package net.trajano.swarm.gateway.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth.controller-mappings")
@Data
public class AuthControllerMappingsProperties {

    /**
     * Mapping for the username password authentication endpoint
     */
    private String usernamePasswordAuthentication;

    /**
     * Mapping for the logout endpoint.
     */
    private String logout;

    /**
     * Mapping for the refresh endpoint.
     */
    private String refresh;

    /**
     * Mapping for the userProfile endpoint.
     */
    private String userProfile;

}
