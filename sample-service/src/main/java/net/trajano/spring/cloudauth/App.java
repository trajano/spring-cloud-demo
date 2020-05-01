package net.trajano.spring.cloudauth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.security.Principal;
import java.util.Map;

@SpringBootApplication
@RestController
public class App {


    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }


    @GetMapping("/")
    public Map<String, Object> index(@RequestHeader("X-B3-Traceid") String traceId, @AuthenticationPrincipal Jwt jwt) {
        final Map<String, Object> claims = Map.of(
            "claims", jwt.getClaims(),
            "trace", traceId
        );
        System.out.println(claims);
        return claims;
    }

    @RequestMapping(value = "/user")
    public Principal user(Principal principal) {
        return principal;
    }
}