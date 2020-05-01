package net.trajano.spring.swarm.discovery;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Optional;
import java.util.Set;

@ConfigurationProperties("docker.discovery")
@Data
public class DockerSwarmDiscoveryProperties {
    /**
     * This is the docker daemon URI.  This defaults to {@code unix:///var/run/docker.sock} which is expected to be on
     * a manager node.  {@code tecnativa/docker-socket-proxy} can be used to proxy the daemon from the manager node
     * to worker nodes for better scaling and security as it will ensure read-only operations are performed on the
     * Docker daemon.
     */
    private String daemonUri = "unix:///var/run/docker.sock";

    /**
     * Specifies a comma separated list of networks to look for services that contain the service labels.
     * If not specified it will use all the networks that the container has access to.
     */
    private String networks;

    /**
     * Specifies the number of milliseconds to wait between event publishing.  Defaults to 1 second.
     */
    private long watchDelay = 1000;

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
