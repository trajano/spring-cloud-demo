package net.trajano.spring.swarm.discovery;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import javax.validation.constraints.NotNull;
import java.util.Optional;
import java.util.Set;

@ConfigurationProperties("docker.discovery")
@Data
public class DockerSwarmDiscoveryProperties {
    /**
     * Specifies a comma separated list of networks to look for services that contain the service labels.
     * If not specified it will use all the networks that the container has access to.
     */
    private String networks;

    @NotNull
    public Set<String> getNetworks() {
        return Optional.ofNullable(networks)
            .map(r -> r.split(","))
            .map(Set::of)
            .orElse(Set.of());
    }

    public boolean hasNetworks() {
        return networks != null && !networks.isBlank();
    }
}
