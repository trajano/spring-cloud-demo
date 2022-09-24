package net.trajano.swarm.gateway.grpc;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.ReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Checks if the current or previous signing keys are present. */
@Component
@RequiredArgsConstructor
public class GrpcHealthIndicator implements ReactiveHealthIndicator {

  private final ChannelProvider channelProvider;

  @Override
  public Mono<Health> health() {

    return Mono.fromSupplier(
        () -> {
          final var channels = channelProvider.getChannels();
          return Health.status(Status.UP).withDetails(channels).build();
        });
  }
}
