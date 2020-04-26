package net.trajano.spring.cloudgateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;

import java.security.Security;

@SpringBootApplication
public class App {
//    @Bean
//    public ForwardedHeaderTransformerForOAuthOnly forwardedHeaderTransformer() {
//        return new ForwardedHeaderTransformerForOAuthOnly();
//    }

    @Bean
    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
        return new ForwardedHeaderTransformer();
    }
//
//    @Bean
//    public SecurityWebFilterChain springSecurityFilterChain(
//        final ServerHttpSecurity http) {
//        http.authorizeExchange()
////            .matchers(
////                new PathPatternParserServerWebExchangeMatcher("/oauth2/authorization/**", HttpMethod.GET),
////                new PathPatternParserServerWebExchangeMatcher("/login/oauth2/code/**", HttpMethod.GET)
////            )
//            .anyExchange()
//            .authenticated()
//            .and()
//            .oauth2Login()
//        ;
//        // .authenticationMatcher();
////            .oauth2Login(c -> {
//////                c.authenticationConverter(d -> {
//////                    System.out.println(">>>>>" + d);
//////                    return d;
//////                });
////                // c.authorizationRequestResolver()
//////                c.securityContextRepository()
////                System.out.println(">>>>>" + c);
////            });
//        return http.build();
//    }
//        ReactiveClientRegistrationRepository clientRegistrationRepository) {
    // Authenticate through configured OpenID Provider
//        http.oauth2Login();

//        http
//            .authorizeExchange().anyExchange().authenticated()
//            .and()
//            .oauth2Login();

//        // Also logout at the OpenID Connect provider
//        http.logout(logout -> logout.logoutSuccessHandler(
//            new OidcClientInitiatedServerLogoutSuccessHandler(clientRegistrationRepository)));
//
//        // Require authentication for all requests
//        http.authorizeExchange().anyExchange().authenticated();
//
//        // Allow showing /home within a frame
//        http.headers().frameOptions().mode(XFrameOptionsServerHttpHeadersWriter.Mode.SAMEORIGIN);
//
//        // Disable CSRF in the gateway to prevent conflicts with proxied service CSRF
//        http.csrf().disable();
//    @Bean
//    public SecurityWebFilterChain springSecurityFilterChain(
//        ServerHttpSecurity http,
//        ReactiveClientRegistrationRepository clientRegistrationRepository) {
//        // Authenticate through configured OpenID Provider
////        http.oauth2Login();
//
////        http
////            .authorizeExchange().anyExchange().authenticated()
////            .and()
////            .oauth2Login();
//
////        // Also logout at the OpenID Connect provider
////        http.logout(logout -> logout.logoutSuccessHandler(
////            new OidcClientInitiatedServerLogoutSuccessHandler(clientRegistrationRepository)));
////
////        // Require authentication for all requests
////        http.authorizeExchange().anyExchange().authenticated();
////
////        // Allow showing /home within a frame
////        http.headers().frameOptions().mode(XFrameOptionsServerHttpHeadersWriter.Mode.SAMEORIGIN);
////
////        // Disable CSRF in the gateway to prevent conflicts with proxied service CSRF
////        http.csrf().disable();
//        return http.build();
//    }

    public static void main(String[] args) {
        Security.setProperty("networkaddress.cache.ttl", "1");
        SpringApplication.run(App.class, args);
    }
}
