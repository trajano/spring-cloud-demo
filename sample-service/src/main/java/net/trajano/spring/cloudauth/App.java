package net.trajano.spring.cloudauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@SpringBootApplication
@RestController
//@EnableOAuth2Client
public class App {

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }

    @GetMapping("/")
    public String index(@RequestHeader("X-B3-Traceid") String traceId, @AuthenticationPrincipal Jwt jwt) {
        return String.format("Hello, %s %s!", jwt.getSubject(), traceId);
    }

    @RequestMapping(value = "/user")
    public Principal user(Principal principal) {
        return principal;
    }
}