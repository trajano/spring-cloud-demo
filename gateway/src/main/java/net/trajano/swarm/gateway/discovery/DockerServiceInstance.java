package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerNetwork;
import com.github.dockerjava.api.model.Network;
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
    } else {
      this.port = Integer.parseInt(labels.getOrDefault(labelPrefix + ".port", "8080"));
      this.secure = Boolean.parseBoolean(labels.getOrDefault(labelPrefix + ".secure", "false"));
    }
    this.metadata = Util.getMetaDataFromLabels(labelPrefix, serviceId, multiId, labels);
    if (secure) {
      this.uri = URI.create("https://" + host + ":" + port);
    } else {
      this.uri = URI.create("http://" + host + ":" + port);
    }
  }

  public DockerServiceInstance(
      Container container, String labelPrefix, String serviceId, Network network) {

    this.serviceId = serviceId;

    this.host =
        container.getNetworkSettings().getNetworks().values().stream()
            .filter(n -> n.getNetworkID().equals(network.getId()))
            .findAny()
            .map(ContainerNetwork::getIpAddress)
            .orElseThrow();
    this.port = container.getPorts()[0].getPrivatePort();
    final var labels = container.getLabels();
    var multiId = labels.containsKey(labelPrefix + ".ids");
    if (multiId) {
      this.secure =
          Boolean.parseBoolean(
              labels.getOrDefault(labelPrefix + "." + serviceId + ".secure", "false"));
    } else {
      this.secure = Boolean.parseBoolean(labels.getOrDefault(labelPrefix + ".secure", "false"));
    }
    this.metadata = Util.getMetaDataFromLabels(labelPrefix, serviceId, multiId, labels);
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
