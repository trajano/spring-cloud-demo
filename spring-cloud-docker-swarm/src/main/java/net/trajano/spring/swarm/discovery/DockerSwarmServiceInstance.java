package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.api.model.Service;
import org.springframework.cloud.client.DefaultServiceInstance;

import javax.validation.constraints.NotNull;

import static net.trajano.spring.swarm.discovery.DockerSwarmDiscoveryUtil.computeDiscoveryServiceId;

/**
 * Service instance that computes the schema.
 */
public class DockerSwarmServiceInstance extends DefaultServiceInstance {

    public DockerSwarmServiceInstance(
        @NotNull final Service service,
        @NotNull final String host
    ) {

        super(service.getId() + "_" + host,
            computeDiscoveryServiceId(service),
            host,
            Integer.parseInt(service.getSpec().getLabels().getOrDefault("spring.service.port", "8080")),
            Boolean.parseBoolean(service.getSpec().getLabels().getOrDefault("spring.service.secure", "false")),
            service.getSpec().getLabels());
    }

    @Override
    public String getScheme() {
        return getUri().getScheme();
    }

}
