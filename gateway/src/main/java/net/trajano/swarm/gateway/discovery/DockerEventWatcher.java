package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import java.io.Closeable;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DockerEventWatcher implements ApplicationListener<ContextClosedEvent> {

  private final ApplicationEventPublisher publisher;
  private final DockerServiceInstanceLister dockerServiceInstanceLister;
  private final DockerClient dockerClient;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;

  /** The watch scheduler. This is a single thread executor as there's only one event watcher. */
  private final ScheduledExecutorService scheduledExecutorService =
      Executors.newSingleThreadScheduledExecutor();

  private final DockerEventWatcherEventCallback dockerEventWatcherEventCallback =
      new DockerEventWatcherEventCallback();

  private volatile boolean closing;

  @Override
  public void onApplicationEvent(ContextClosedEvent event) {

    log.error("Context Closing {}", event);
    closing = true;
    try {
      dockerEventWatcherEventCallback.close();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
    scheduledExecutorService.shutdown();
  }

  /** Initializes the scheduler */
  @PostConstruct
  public void startWatching() {
    scheduledExecutorService.scheduleWithFixedDelay(this::watch, 1L, 10L, TimeUnit.SECONDS);
  }

  @PreDestroy
  public void stopWatching() {
    try {
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
  private void watch() {

    try {
      log.debug("Docker event watcher started");
      dockerClient
          .eventsCmd()
          .withSince(String.valueOf(Instant.now().getEpochSecond()))
          .withEventTypeFilter(
              dockerDiscoveryProperties.isSwarmMode() ? EventType.SERVICE : EventType.CONTAINER)
          .exec(dockerEventWatcherEventCallback);
      dockerEventWatcherEventCallback.awaitCompletion();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  class DockerEventWatcherEventCallback extends ResultCallbackTemplate<ResultCallback<Event>, Event>
      implements Closeable {

    @Override
    public void onNext(Event event) {

      if (closing) {
        log.error("Not processing {} as the context is closing", event);
        return;
      }
      if (event.getType() == EventType.SERVICE) {

        if (event.getActor().getAttributes().containsKey("replicas.new")) {
          final var serviceId = event.getActor().getAttributes().get("name");
          log.debug(
              "replica count change detected for {} requesting no-op update to service to trigger another event",
              serviceId);
          final var inspectResult = dockerClient.inspectServiceCmd(serviceId).exec();
          dockerClient
              .updateServiceCmd(serviceId, inspectResult.getSpec())
              .withVersion(inspectResult.getVersion().getIndex())
              .exec();
          return;
        }

        if (closing) {
          log.error("Not processing {} as the context is closing", event);
          return;
        }
        dockerServiceInstanceLister.refresh(true);
        if (closing) {
          log.error("Not processing {} as the context is closing", event);
          return;
        }
        publisher.publishEvent(new RefreshRoutesEvent(this));
      }
    }
  }
}
