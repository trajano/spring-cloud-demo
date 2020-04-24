package net.trajano.spring.cloudgateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;

import java.security.Security;

@SpringBootApplication
@EnableAutoConfiguration
@EnableDiscoveryClient
public class App {
//    @Bean
//    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
//        return new ForwardedHeaderTransformer();
//    }

    //    @Bean
//    public ForwardedHeaderFilter forwardedHeaderFilter() {
//        return new ForwardedHeaderFilter();
//    }
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
