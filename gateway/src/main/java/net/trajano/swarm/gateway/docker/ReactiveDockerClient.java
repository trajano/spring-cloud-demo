package net.trajano.swarm.gateway.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import com.github.dockerjava.api.model.Service;
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
  private final DockerProperties dockerProperties;
  private final DockerClient dockerClient;

  public DockerClient blockingClient() {
    return dockerClient;
  }

  public ListContainersCmd listContainersCmd() {
    return dockerClient.listContainersCmd();
  }

  /**
   * Generates an event flux.
   *
   * @param eventsCmd
   * @return
   */
  public Flux<Event> events(EventsCmd eventsCmd) {

    final Flux<Event> eventFlux =
        Flux.create(
            sink -> {
              var sinkResultCallback = new FluxSinkEventCallback(sink);
              eventsCmd.exec(sinkResultCallback);
            });
    return eventFlux.retry();
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

  public Flux<Container> containers(ListContainersCmd listContainersCmd) {

    return Mono.fromCallable(listContainersCmd::exec).flatMapIterable(Function.identity());
  }

  public Flux<Container> containers() {

    return containers(dockerClient.listContainersCmd());
  }

  @RequiredArgsConstructor
  private static class FluxSinkEventCallback
      extends ResultCallbackTemplate<ResultCallback<Event>, Event> {
    private final FluxSink<Event> fluxSink;

    @Override
    public void close() throws IOException {
      super.close();
      fluxSink.complete();
    }

    @Override
    public void onError(Throwable throwable) {
      try {
        super.close();
        fluxSink.error(throwable);
      } catch (IOException e) {
        fluxSink.error(e);
      }
    }

    @Override
    public void onNext(Event event) {
      fluxSink.next(event);
    }
  }
}
