package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerNetwork;
import com.github.dockerjava.api.model.Network;
import java.net.URI;
import java.util.Map;
import org.springframework.cloud.client.ServiceInstance;

public class ContainerServiceInstance implements ServiceInstance {

  private final String serviceId;

  private final String host;

  private final int port;

  private final Map<String, String> metadata;

  private final boolean secure;

  private final URI uri;

  public ContainerServiceInstance(
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
    var multiId = labels.containsKey("%s.ids".formatted(labelPrefix));
    if (multiId) {
      this.secure =
          Boolean.parseBoolean(
              labels.getOrDefault("%s.%s.secure".formatted(labelPrefix, serviceId), "false"));
      this.metadata = Util.getMetaDataFromLabels(labelPrefix, serviceId, true, labels);
    } else {
      this.secure =
          Boolean.parseBoolean(labels.getOrDefault("%s.secure".formatted(labelPrefix), "false"));
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
