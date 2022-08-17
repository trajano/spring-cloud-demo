package net.trajano.swarm.sampleservice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
public class GrpcController {
  // Phase 1 simple strings
  // phase 2 map to GRPC call
  // phase 3 replace with data buffers
  @PostMapping(
      path = "/{service}/{method}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public Mono<String> serviceCall(
      @PathVariable String service, @PathVariable String method, @RequestBody String json) {
    return Mono.just("service + " + service + " method " + method + " data" + json);
  }
}
