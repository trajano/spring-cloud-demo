package net.trajano.swarm.gateway.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class CoreController {

  @RequestMapping("/unavailable")
  @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
  public Mono<GatewayResponse> unavailable() {

    return Mono.just(GatewayResponse.builder().errorCode("service_unavailable").ok(false).build());
  }

  @RequestMapping("/ping")
  public Mono<GatewayResponse> ping() {

    return Mono.just(GatewayResponse.builder().ok(true).build());
  }
}
