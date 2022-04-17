package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.Closeable;
import java.io.IOException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CountDownLatch;

@Service
@Slf4j
public class DockerEventWatcher {

    private final ApplicationEventPublisher publisher;

    private final DockerClient dockerClient;

    private final DockerDiscoveryConfig dockerDiscoveryConfig;

    public DockerEventWatcher(ApplicationEventPublisher publisher, DockerClient dockerClient, DockerDiscoveryConfig dockerDiscoveryConfig) {

        this.publisher = publisher;
        this.dockerClient = dockerClient;
        this.dockerDiscoveryConfig = dockerDiscoveryConfig;
    }

    @Scheduled(fixedDelay = 1L, initialDelay = 10L)
    public void startWatching() {

        final CountDownLatch latch = new CountDownLatch(1);
        try {
            dockerClient.eventsCmd()
                    .withSince(String.valueOf(Instant.now().getEpochSecond()))
                    .withEventTypeFilter(dockerDiscoveryConfig.isSwarmMode() ? EventType.SERVICE : EventType.CONTAINER)
                    .exec(new ResultCallback<Event>() {
                        @Override
                        public void onStart(Closeable closeable) {

                            log.error("onStart" + closeable);

                        }

                        @Override
                        public void onNext(Event object) {

                            log.error("next" + object);

                            publisher.publishEvent(new RefreshRoutesEvent(object));
                        }

                        @Override
                        public void onError(Throwable throwable) {

                            log.error("error", throwable);

                        }

                        @Override
                        public void onComplete() {

                            latch.countDown();
                            log.error("complete");
                        }

                        @Override
                        public void close() throws IOException {

                            log.error("close");
                        }
                    });
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

}
