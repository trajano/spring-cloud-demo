package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;

import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class DockerSwarmDiscoveryClient implements DiscoveryClient {

    private final DockerSwarmDiscovery dockerSwarmDiscovery;

    public DockerSwarmDiscoveryClient(@NotNull DockerSwarmDiscovery dockerSwarmDiscovery) {
        this.dockerSwarmDiscovery = dockerSwarmDiscovery;
    }

    /**
     * {@inheritDoc}
     *
     * @return {@code "Docker Swarm Blocking Discovery Client"}
     */
    @Override
    public String description() {
        return "Docker Swarm Blocking Discovery Client";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<ServiceInstance> getInstances(final String serviceId) {
        return dockerSwarmDiscovery.getInstances(serviceId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<String> getServices() {
        return new ArrayList<>(dockerSwarmDiscovery.getServices());
    }

}
