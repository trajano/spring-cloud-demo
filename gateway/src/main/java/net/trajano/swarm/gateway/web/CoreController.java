package net.trajano.swarm.gateway.web;

import java.net.URI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
public class CoreController {

  @Value("${gateway.root-html-redirect-uri:#{null}}")
  private URI rootHtmlRedirectUri;

  @Autowired private ResourceLoader resourceLoader;

  @RequestMapping("/unavailable")
  @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
  public Mono<GatewayResponse> unavailable() {

    return Mono.just(GatewayResponse.builder().error("service_unavailable").ok(false).build());
  }

  @GetMapping("/ping")
  public Mono<GatewayResponse> ping() {

    return Mono.just(GatewayResponse.builder().ok(true).build());
  }

  @GetMapping(path = "/", produces = "text/html")
  public Mono<Void> htmlRedirect(ServerHttpResponse response) {
    if (rootHtmlRedirectUri == null) {
      response.setStatusCode(HttpStatus.NO_CONTENT);
    } else {
      response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
      response.getHeaders().setLocation(rootHtmlRedirectUri);
    }
    return response.setComplete();
  }

  @GetMapping("/openapi.json")
  public Mono<Resource> openapi() {

    return Mono.fromSupplier(() -> resourceLoader.getResource("file:///openapi.json"));
  }
}
