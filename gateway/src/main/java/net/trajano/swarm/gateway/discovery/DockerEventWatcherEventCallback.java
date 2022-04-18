package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.model.Event;
import java.io.Closeable;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class DockerEventWatcherEventCallback
    extends ResultCallbackTemplate<ResultCallback<Event>, Event> implements Closeable {

  private final ApplicationEventPublisher publisher;

  private boolean isClosed = false;

  public DockerEventWatcherEventCallback(ApplicationEventPublisher publisher) {

    this.publisher = publisher;
  }

  @Override
  public void onError(Throwable throwable) {

    // Do not perform error handling once the callback is closed
    if (!isClosed) {
      super.onError(throwable);
    }
  }

  @Override
  public void onNext(Event object) {

    if (!isClosed) {
      publisher.publishEvent(new RefreshRoutesEvent(this));
    }
  }

  public void close() {

    isClosed = true;
  }
}
