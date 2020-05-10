package net.trajano.spring.cloudauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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
        return claims;
    }

    @Autowired
    private WebClient webClient;

    @GetMapping("/bounced")
    public Mono<Map<String, Object>> bounced(
        @RequestHeader("X-B3-Traceid") String traceId,
        @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {

        final Mono<Map<String, Object>> sample = webClient.get()
            .uri("http://sample:8080/")
            .header(HttpHeaders.AUTHORIZATION, authorization)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<>() {
            });

        final Mono<Map<String, Object>> httpGet = webClient.get()
            .uri("http://httpbin.org/get")
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<>() {
            });

        final Mono<Map<String, Object>> anything = webClient.get()
            .uri("http://httpbin.org/anything/foo")
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<>() {
            });

        return Mono.zip(anything, sample, httpGet)
            .map(t -> Map.of("traceFromBounced", traceId,
                "anything", t.getT1(),
                "sample", t.getT2(),
                "httpGet", t.getT3()));

    }

    @RequestMapping(value = "/user")
    public Principal user(Principal principal) {
        return principal;
    }
}