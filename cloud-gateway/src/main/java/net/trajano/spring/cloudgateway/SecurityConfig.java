package net.trajano.spring.cloudgateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.DefaultServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher;
import reactor.core.publisher.Mono;

@EnableWebFluxSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, ReactiveClientRegistrationRepository clientRegistrationRepository) {
        final ServerOAuth2AuthorizationRequestResolver authorizationRequestResolver = new DefaultServerOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            new PathPatternParserServerWebExchangeMatcher("/v1/oauth2/{registrationId}")
        );
        http
            .authorizeExchange(exchanges -> exchanges
                    .pathMatchers("/auth/**").permitAll()
                    .pathMatchers("/*/auth/**").permitAll()
                    .pathMatchers("/actuator/**").permitAll()
//                .pathMatchers("/whoami").permitAll()
                    .anyExchange().authenticated()
            )
            .oauth2Login()
            .authenticationManager(new ReactiveAuthenticationManager() {
                @Override
                public Mono<Authentication> authenticate(Authentication authentication) {
                    return null;
                }
            })
            .authorizationRequestResolver(authorizationRequestResolver);
//        http.securityMatcher(
//            new OrServerWebExchangeMatcher(
//                new PathPatternParserServerWebExchangeMatcher("/auth/**"),
//                new PathPatternParserServerWebExchangeMatcher("/*/auth/**")
//            ))
//            .headers()
//            .frameOptions().mode(XFrameOptionsServerHttpHeadersWriter.Mode.SAMEORIGIN);
//        http.securityMatcher(
//            new OrServerWebExchangeMatcher(
//                new PathPatternParserServerWebExchangeMatcher("/auth/**"),
//                new PathPatternParserServerWebExchangeMatcher("/*/auth/**")
//            ))
//            .csrf().disable();
        return http.build();
    }
}