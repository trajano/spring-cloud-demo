package net.trajano.swarm.gateway.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.command.ListNetworksCmd;
import com.github.dockerjava.api.model.*;
import java.io.IOException;
import java.io.UncheckedIOException;
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

  public ListNetworksCmd listNetworksCmd() {
    return dockerClient.listNetworksCmd();
  }

  public Flux<Network> networks(ListNetworksCmd listNetworksCmd) {
    return Flux.from(
        s -> {
          try {
            listNetworksCmd.exec().forEach(s::onNext);
          } catch (Throwable e) {
            s.onError(e);
          }
        });
  }
  /**
   * Generates an event flux. This retries on errors indefinitely.
   *
   * @param eventsCmd
   * @return
   */
  public Flux<Event> events(EventsCmd eventsCmd) {

    final Flux<Event> eventFlux =
        Flux.create(
            emitter -> {
              var sinkResultCallback = new FluxSinkEventCallback(emitter);
              eventsCmd.exec(sinkResultCallback);

              emitter.onDispose(
                  () -> {
                    try {
                      sinkResultCallback.close();
                    } catch (IOException e) {
                      throw new UncheckedIOException(e);
                    }
                  });
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
    private final FluxSink<Event> emitter;

    @Override
    public void close() throws IOException {
      super.close();
      emitter.complete();
    }

    @Override
    public void onError(Throwable throwable) {
      try {
        super.close();
        emitter.error(throwable);
      } catch (IOException e) {
        emitter.error(e);
      }
    }

    @Override
    public void onNext(Event event) {
      emitter.next(event);
    }
  }
}
