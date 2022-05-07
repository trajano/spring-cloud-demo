package net.trajano.swarm.gateway.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import com.github.dockerjava.api.model.Service;
import java.io.Closeable;
import java.io.IOException;
import java.time.Instant;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.publisher.Mono;

/** Wraps the native docker client with project reactor bindings. */
@Component
@RequiredArgsConstructor
public class ReactiveDockerClient {
  private final DockerClient dockerClient;

  public DockerClient blockingClient() {
    return dockerClient;
  }

  public Flux<Event> events(EventsCmd eventsCmd) {

    return Flux.create(
        sink -> {
          var sinkResultCallback = new FluxSinkEventCallback(sink);
          eventsCmd.exec(sinkResultCallback);
        });
  }

  public Flux<Event> serviceEvents() {

    return events(
        dockerClient
            .eventsCmd()
            .withSince(String.valueOf(Instant.now().getEpochSecond()))
            .withEventTypeFilter(EventType.SERVICE));
  }

  public Flux<Event> containerEvents() {

    return events(
        dockerClient
            .eventsCmd()
            .withSince(String.valueOf(Instant.now().getEpochSecond()))
            .withEventTypeFilter(EventType.CONTAINER));
  }

  public Flux<Service> services() {

    return Mono.fromCallable(() -> dockerClient.listServicesCmd().exec())
        .flatMapIterable(Function.identity());
  }

  @RequiredArgsConstructor
  private static class FluxSinkEventCallback implements ResultCallback<Event> {
    private final FluxSink<Event> fluxSink;
    private Closeable closeable;

    @Override
    public void close() throws IOException {
      closeable.close();
    }

    @Override
    public void onComplete() {
      fluxSink.complete();
    }

    @Override
    public void onError(Throwable throwable) {
      fluxSink.error(throwable);
    }

    @Override
    public void onNext(Event event) {
      fluxSink.next(event);
    }

    @Override
    public void onStart(Closeable closeable) {
      this.closeable = closeable;
    }
  }
}
