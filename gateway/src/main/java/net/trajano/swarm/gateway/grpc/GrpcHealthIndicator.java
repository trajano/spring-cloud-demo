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
          final var allUp =
              channels.values().stream()
                  .map(s -> !s.isShutdown() && !s.isTerminated())
                  .reduce(true, (current, next) -> current && next);
          return Health.status(allUp ? Status.UP : Status.DOWN).withDetails(channels).build();
        });
  }
}
