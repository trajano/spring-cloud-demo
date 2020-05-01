package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.client.discovery.event.InstanceRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.SmartLifecycle;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ExecutorConfigurationSupport;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
public class DockerSwarmWatchTask implements SmartLifecycle {
    private Semaphore semaphore = new Semaphore(0);

    private final ApplicationEventPublisher publisher;

    private final TaskScheduler taskScheduler;

    private final DockerSwarmDiscoveryProperties properties;

    private final AtomicBoolean running = new AtomicBoolean(false);

    private ScheduledFuture<?> watchFuture;

    public DockerSwarmWatchTask(
        final DockerSwarmDiscoveryProperties properties,
        final ApplicationEventPublisher publisher,
        final ObjectProvider<TaskScheduler> taskSchedulerProvider) {
        this.publisher = publisher;
        this.properties = properties;
        taskScheduler = taskSchedulerProvider.getIfAvailable(DockerSwarmWatchTask::getTaskScheduler);
    }

    private static ThreadPoolTaskScheduler getTaskScheduler() {
        ThreadPoolTaskScheduler taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setBeanName("DockerSwarm-Watch-Task-Scheduler");
        taskScheduler.initialize();
        return taskScheduler;
    }

    public void publish() {
        semaphore.release();
    }

    //    @Scheduled(fixedDelayString = "${docker.swarm.discovery.watch-delay:100}")
    public void publishIfNeeded() {
        try {
            semaphore.acquire();
            semaphore.drainPermits();
            System.out.println("PUB Sched");
            publisher.publishEvent(new InstanceRegisteredEvent<>(this, ""));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Interrupting thread", e);
        }
    }
//
//    @Scheduled(fixedDelay = 20000)
//    public void publishAnyway() {
//        System.out.println("PUB anyway");
//        publisher.publishEvent(new InstanceRegisteredEvent<>(this, ""));
//    }
//
//    @Override
//    public void run() {
//        while (true) {
//            try {
//                semaphore.acquire();
//                semaphore.drainPermits();
//                publisher.publishEvent(new InstanceRegisteredEvent<>(this, ""));
//            } catch (InterruptedException e) {
//                Thread.currentThread().interrupt();
//                log.debug("Interrupting thread", e);
//                break;
//            }
//        }
//    }

    @Override
    public void start() {
        if (running.compareAndSet(false, true)) {
            watchFuture = taskScheduler.scheduleWithFixedDelay(this::publishIfNeeded, properties.getWatchDelay());
        }
    }

    @Override
    public void stop() {
        if (running.compareAndSet(true, false) && this.watchFuture != null) {
            if (taskScheduler instanceof ExecutorConfigurationSupport) {
                ((ExecutorConfigurationSupport) taskScheduler).shutdown();
            }
            watchFuture.cancel(true);
        }
    }

    @Override
    public boolean isRunning() {
        return running.get();
    }
}
