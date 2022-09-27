package net.trajano.swarm.sampleservice.echo;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RestController
@Slf4j
public class EchoController {

  @PostMapping(
      path = "/Echo/echo",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public Mono<EchoResponse> echo(EchoRequest request) {

    return Mono.just(
        EchoResponse.builder().message(request.getMessage()).timestamp(Instant.now()).build());
  }

  @PostMapping(
      path = "/Echo/echoStream",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<ServerSentEvent<EchoResponse>> echoStream(EchoRequest request) {

    return Flux.<EchoResponse>generate(
            sink -> {
              sink.next(
                  EchoResponse.builder()
                      .message(request.getMessage())
                      .timestamp(Instant.now())
                      .build());
            })
        .map(
            response ->
                ServerSentEvent.builder(response)
                    .id(UUID.randomUUID().toString())
                    .comment("Expect the next one in 2 seconds")
                    .build())
        .delayElements(Duration.ofSeconds(2));
  }
}
