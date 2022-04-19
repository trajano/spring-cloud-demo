package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import java.io.Closeable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;

@Slf4j
public class DockerEventWatcherEventCallback
    extends ResultCallbackTemplate<ResultCallback<Event>, Event> implements Closeable {

  private final ApplicationEventPublisher publisher;
  private final DockerServiceInstanceLister dockerServiceInstanceLister;
  private final DockerClient dockerClient;

  private boolean isClosed = false;

  public DockerEventWatcherEventCallback(
      ApplicationEventPublisher publisher,
      DockerServiceInstanceLister dockerServiceInstanceLister,
      DockerClient dockerClient) {

    this.publisher = publisher;
    this.dockerServiceInstanceLister = dockerServiceInstanceLister;
    this.dockerClient = dockerClient;
  }

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
        log.info(
            "replica count change detected for {} requesting no-op update to service to trigger another event",
            serviceId);
        final var inspectResult = dockerClient.inspectServiceCmd(serviceId).exec();
        dockerClient
            .updateServiceCmd(serviceId, inspectResult.getSpec())
            .withVersion(inspectResult.getVersion().getIndex())
            .exec();
        return;
      }

      dockerServiceInstanceLister.refresh();
      publisher.publishEvent(new RefreshRoutesEvent(this));
    }
  }

  public void close() {

    isClosed = true;
  }
}
