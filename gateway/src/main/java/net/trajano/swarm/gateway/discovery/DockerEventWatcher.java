package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import java.nio.channels.AsynchronousCloseException;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.docker.ReactiveDockerClient;
import org.reactivestreams.Publisher;
import reactor.core.Disposable;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SignalType;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Slf4j
@RequiredArgsConstructor
public class DockerEventWatcher { // implements ApplicationListener<ContextClosedEvent> {

  private final DockerServiceInstanceLister dockerServiceInstanceLister;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;
  private final Scheduler dockerWatchScheduler = Schedulers.newSingle("docker-watch");

  private final ReactiveDockerClient reactiveDockerClient;

  private final ExecutorService watchExecutor = Executors.newSingleThreadExecutor();

  private final AtomicBoolean cancelled = new AtomicBoolean(false);

  private Disposable.Swap subscription = Disposables.swap();

  /**
   * Provides an event flux that never ends.
   *
   * @return flux of events.
   */
  private Flux<Event> eventFlux() {
    final var sourceFlux =
        dockerDiscoveryProperties.isSwarmMode()
            ? reactiveDockerClient.serviceEvents()
            : reactiveDockerClient.containerEvents();

    return sourceFlux.flatMap(this::handleScenarioWhenOnlyReplicaCountsAreChanged);
  }

  private Publisher<? extends Event> handleScenarioWhenOnlyReplicaCountsAreChanged(Event event) {

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
  }

  public void startWatching() {
    watchExecutor.execute(
        () -> {
          while (!cancelled.get()) {
            watch();
          }
        });
  }

  public void stopWatching() {
    subscription.dispose();
  }

  /**
   * Watches for events. There are times when the connection stops and requires the client to
   * reconnect, the scheduler is responsible for rebuilding the watcher and re-establishing the
   * connection.
   */
  private void watch() {

    final var latch = new CountDownLatch(1);
    final Flux<Event> publishingEventFlux =
        eventFlux()
            // only take one event per second to avoid flooding
            // .sampleFirst(Duration.ofSeconds(1))
            .sample(Duration.ofSeconds(1))
            .onErrorResume(
                AsynchronousCloseException.class,
                throwable -> {
                  log.trace(
                      "Silently dropping {}, this occurs when the system is shutting down",
                      throwable);
                  return Flux.empty();
                })
            .doOnNext(ignore -> dockerServiceInstanceLister.refresh(true));

    subscription.update(
        publishingEventFlux
            .doFinally(
                signalType -> {
                  cancelled.set(signalType == SignalType.CANCEL);
                  latch.countDown();
                })
            .subscribe());
    try {
      latch.await();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      cancelled.set(true);
    }
  }
}
