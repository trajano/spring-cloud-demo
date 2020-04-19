package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.api.model.Service;
import org.springframework.cloud.client.ServiceInstance;

import java.net.URI;
import java.util.Map;

public class DockerServiceInstance implements ServiceInstance {
    private final Service dockerService;

    private final int port;

    private final boolean secure;

    private final Map<String, String> metadata;

    private final String host;

    private final String serviceId;

    private final URI uri;

    public DockerServiceInstance(final Service dockerService, final String host) {
        this.dockerService = dockerService;
        final Map<String, String> labels = dockerService.getSpec().getLabels();
        this.port = Integer.parseInt(labels.getOrDefault("spring.service.port", "8080"));
        this.secure = Boolean.parseBoolean(labels.getOrDefault("spring.service.secure", "false"));
        this.metadata = labels;
        this.host = host;
        this.serviceId = labels.computeIfAbsent("spring.service.id", k -> dockerService.getId());
        this.uri = null;
    }


    @Override
    public String getServiceId() {
        return serviceId;
    }

    @Override
    public String getHost() {
        return host;
    }

    @Override
    public int getPort() {
        return port;
    }

    @Override
    public boolean isSecure() {
        return secure;
    }

    @Override
    public URI getUri() {
        return uri;
    }

    @Override
    public Map<String, String> getMetadata() {
        return metadata;
    }
}
