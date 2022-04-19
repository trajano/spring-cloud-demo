package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.EventType;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DockerEventWatcher {

  private final DockerEventWatcherEventCallback dockerEventWatcherEventCallback;

  private final DockerClient dockerClient;

  private final DockerDiscoveryConfig dockerDiscoveryConfig;

  public DockerEventWatcher(
      DockerEventWatcherEventCallback dockerEventWatcherEventCallback,
      DockerClient dockerClient,
      DockerDiscoveryConfig dockerDiscoveryConfig) {

    this.dockerEventWatcherEventCallback = dockerEventWatcherEventCallback;

    this.dockerClient = dockerClient;
    this.dockerDiscoveryConfig = dockerDiscoveryConfig;
  }

  /** Watches for events. */
  @Scheduled(fixedDelay = 1L, initialDelay = 10L)
  public void startWatching() {

    try {
      log.debug("Docker event watcher started");
      dockerClient
          .eventsCmd()
          .withSince(String.valueOf(Instant.now().getEpochSecond()))
          .withEventTypeFilter(
              dockerDiscoveryConfig.isSwarmMode() ? EventType.SERVICE : EventType.CONTAINER)
          .exec(dockerEventWatcherEventCallback);
      dockerEventWatcherEventCallback.awaitCompletion();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
