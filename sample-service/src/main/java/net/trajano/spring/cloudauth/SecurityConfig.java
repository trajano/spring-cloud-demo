package net.trajano.spring.cloudauth;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.reactive.function.client.WebClient;

@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .oauth2ResourceServer()
            .jwt();
        return http.build();
    }

    @Bean
    WebClient webClient() {
        // (optional) explicitly opt into using the oauth2Login to provide an access token implicitly
        // oauth.setDefaultOAuth2AuthorizedClient(true);
        // (optional) set a default ClientRegistration.registrationId
        // oauth.setDefaultClientRegistrationId("client-registration-id");
        return WebClient.builder()
            .build();
    }
}