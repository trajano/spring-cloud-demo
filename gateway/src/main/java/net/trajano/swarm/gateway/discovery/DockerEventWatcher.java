package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.Closeable;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class DockerEventWatcher {

  private final ApplicationEventPublisher publisher;
  private final DockerServiceInstanceLister dockerServiceInstanceLister;
  private final DockerClient dockerClient;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;

  /** Watches for events. */
  @Scheduled(fixedDelay = 1L, initialDelay = 10L)
  public void startWatching() {

    final DockerEventWatcherEventCallback dockerEventWatcherEventCallback =
        new DockerEventWatcherEventCallback();
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

    private boolean isClosed = false;

    @Override
    public void onError(Throwable throwable) {

      // Do not perform error handling once the callback is closed
      if (!isClosed) {
        super.onError(throwable);
      }
    }

    @Override
    public void onNext(Event event) {

      if (!isClosed && event.getType() == EventType.SERVICE) {

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

        dockerServiceInstanceLister.refresh(true);
        publisher.publishEvent(new RefreshRoutesEvent(this));
      }
    }

    public void close() {

      isClosed = true;
    }
  }
}
