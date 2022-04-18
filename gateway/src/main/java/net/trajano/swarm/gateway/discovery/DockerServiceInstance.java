package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Service;
import java.net.URI;
import java.util.Map;
import java.util.Objects;
import lombok.Data;
import org.springframework.cloud.client.ServiceInstance;

@Data
public class DockerServiceInstance implements ServiceInstance {

  private final String serviceId;

  private final String host;

  private final int port;

  private final Map<String, String> metadata;

  private final boolean secure;

  private final URI uri;

  public DockerServiceInstance(Service service, String labelPrefix, String serviceId, String host) {

    this.serviceId = serviceId;
    this.host = host;
    final var labels = Objects.requireNonNull(service.getSpec()).getLabels();
    var multiId = labels.containsKey(labelPrefix + ".ids");
    if (multiId) {
      this.port =
          Integer.parseInt(labels.getOrDefault(labelPrefix + "." + serviceId + ".port", "8080"));
      this.secure =
          Boolean.parseBoolean(
              labels.getOrDefault(labelPrefix + "." + serviceId + ".secure", "false"));
      this.metadata = Util.getMetaDataFromLabels(labelPrefix, serviceId, multiId, labels);
    } else {
      this.port = 0;
      this.secure = false;
      this.metadata = Map.of();
    }
    if (secure) {
      this.uri = URI.create("https://" + host + ":" + port);
    } else {
      this.uri = URI.create("http://" + host + ":" + port);
    }
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
