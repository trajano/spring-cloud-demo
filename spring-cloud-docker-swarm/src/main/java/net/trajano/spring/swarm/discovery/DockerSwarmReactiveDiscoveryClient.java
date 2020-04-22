package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
public class DockerSwarmReactiveDiscoveryClient implements ReactiveDiscoveryClient {

    private final DockerSwarmDiscovery dockerSwarmDiscovery;

    public DockerSwarmReactiveDiscoveryClient(final DockerSwarmDiscovery dockerSwarmDiscovery) {

        this.dockerSwarmDiscovery = dockerSwarmDiscovery;
    }
    /**
     * {@inheritDoc}
     *
     * @return {@code "Docker Swarm Reactive Discovery Client"}
     */
    @Override
    public String description() {
        return "Docker Swarm Reactive Discovery Client";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Flux<ServiceInstance> getInstances(final String serviceId) {

        return Mono.justOrEmpty(serviceId)
            .flatMapMany(
                id -> Flux.fromIterable(dockerSwarmDiscovery.getInstances(id))
            )
            .subscribeOn(Schedulers.boundedElastic());

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Flux<String> getServices() {
        return Flux.defer(() -> Flux.fromIterable(dockerSwarmDiscovery.getServices()))
            .subscribeOn(Schedulers.boundedElastic());
    }
}
