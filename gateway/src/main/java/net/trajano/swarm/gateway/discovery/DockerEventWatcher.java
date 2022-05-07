package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import java.nio.channels.AsynchronousCloseException;
import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.docker.ReactiveDockerClient;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

@Slf4j
@RequiredArgsConstructor
public class DockerEventWatcher { // implements ApplicationListener<ContextClosedEvent> {

  //  private final ApplicationContext applicationContext;
  //  private final ApplicationEventPublisher publisher;
  private final DockerServiceInstanceLister dockerServiceInstanceLister;
  //  private final DockerClient dockerClient;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;

  //  /** The watch scheduler. This is a single thread executor as there's only one event watcher.
  // */
  private final ScheduledExecutorService scheduledExecutorService =
      Executors.newSingleThreadScheduledExecutor();

  //  private final DockerEventWatcherEventCallback dockerEventWatcherEventCallback =
  //      new DockerEventWatcherEventCallback();

  private final ReactiveDockerClient reactiveDockerClient;

  //  private volatile boolean closing;

  private Disposable subscription;

  //  @Override
  //  public void onApplicationEvent(ContextClosedEvent event) {
  //
  //    if (event.getApplicationContext() != applicationContext) {
  //      return;
  //    }
  //    log.trace("closing callbacks and scheduled executor as context is closing", event);
  //
  //    try {
  //      scheduledExecutorService.shutdown();
  //      subscription.dispose();
  //      scheduledExecutorService.awaitTermination(2, TimeUnit.SECONDS);
  //    } catch (InterruptedException e) {
  //      Thread.currentThread().interrupt();
  //    }
  //  }

  /** Initializes the scheduler */
  public void startWatching() {

    scheduledExecutorService.scheduleWithFixedDelay(this::watch, 1L, 10L, TimeUnit.SECONDS);
  }

  public void stopWatching() {
    try {
      scheduledExecutorService.shutdown();
      subscription.dispose();
      scheduledExecutorService.awaitTermination(2, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  /**
   * Watches for events. There are times when the connection stops and requires the client to
   * reconnect, the scheduler is responsible for rebuilding the watcher and re-establishing the
   * connection.
   */
  public void watch() {

    //    log.debug("Docker event watcher started");
    final Flux<Event> eventFlux =
        dockerDiscoveryProperties.isSwarmMode()
            ? reactiveDockerClient.serviceEvents()
            : reactiveDockerClient.containerEvents();
    subscription =
        eventFlux
            .flatMap(
                event -> {
                  if (event.getType() == EventType.SERVICE)
                    if (event.getActor().getAttributes().containsKey("replicas.new")) {
                      final var serviceId = event.getActor().getAttributes().get("name");
                      log.debug(
                          "replica count change detected for {} requesting no-op update to service to trigger another event",
                          serviceId);
                      final var inspectResult =
                          reactiveDockerClient.blockingClient().inspectServiceCmd(serviceId).exec();
                      reactiveDockerClient
                          .blockingClient()
                          .updateServiceCmd(serviceId, inspectResult.getSpec())
                          .withVersion(inspectResult.getVersion().getIndex())
                          .exec();
                      return Flux.empty();
                    }
                  return Flux.just(event);
                })
            // only take one event per second to avoid flooding
            .sample(Duration.ofSeconds(1))
            .onErrorResume(
                AsynchronousCloseException.class,
                throwable -> {
                  log.trace(
                      "Silently dropping {}, this occurs when the system is shutting down",
                      throwable);
                  return Flux.empty();
                })
            .doOnNext(ignore -> dockerServiceInstanceLister.refresh(true))
            .subscribe();

    //            .doOnNext(ignore -> publisher.publishEvent(new RefreshRoutesEvent(this)))
    //            .subscribe();
  }
}
