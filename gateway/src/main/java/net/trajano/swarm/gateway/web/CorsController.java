package net.trajano.swarm.gateway.web;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import reactor.core.publisher.Mono;

// @RestController
public class CorsController {

  @RequestMapping(method = RequestMethod.OPTIONS)
  public Mono<Void> serverResponseMono() {

    System.out.println("HERE");
    return Mono.empty();
  }
}
