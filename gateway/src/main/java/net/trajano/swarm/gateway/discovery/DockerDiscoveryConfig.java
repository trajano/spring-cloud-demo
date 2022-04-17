package net.trajano.swarm.gateway.discovery;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "docker.discovery")
@Data
public class DockerDiscoveryConfig {

    /**
     * Label prefix to process.
     */
    private String labelPrefix = "docker";

    /**
     * Network to scan services/containers on.
     */
    private String network = "services";

    /**
     * Swarm mode.  If true, it will scan services rather than containers.
     */
    private boolean swarmMode = false;

    public List<String> idsLabelFilter() {

        return List.of(idsLabel());
    }

    public String idsLabel() {

        return labelPrefix + ".ids";
    }

    public String idLabel() {

        return labelPrefix + ".id";
    }

}
