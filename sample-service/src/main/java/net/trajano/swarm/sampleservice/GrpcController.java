package net.trajano.swarm.sampleservice;

import java.time.Duration;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
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

  @PostMapping(
      path = "/{service}/{method}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public Flux<ServerSentEvent<String>> serviceCallStreamResult(
      @PathVariable String service, @PathVariable String method, @RequestBody String json) {
    return Flux.just(
            "service1 + " + service + " method " + method + " data" + json,
            "service2 + " + service + " method " + method + " data" + json)
        .delayElements(Duration.ofSeconds(1))
        .map(
            s ->
                ServerSentEvent.<String>builder()
                    .id(UUID.randomUUID().toString())
                    .event("a")
                    .comment("comment")
                    .data(s)
                    .build());
  }
}
