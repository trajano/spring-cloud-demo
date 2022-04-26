package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerNetwork;
import com.github.dockerjava.api.model.Network;
import org.springframework.cloud.client.ServiceInstance;

import java.net.URI;
import java.util.Map;

public class ContainerServiceInstance implements ServiceInstance {

  private final String serviceId;

  private final String host;

  private final int port;

  private final Map<String, String> metadata;

  private final boolean secure;

  private final URI uri;

  public ContainerServiceInstance(
      Container container, String prefix, String serviceId, Network network) {

    this.serviceId = serviceId;
    this.host =
        container.getNetworkSettings().getNetworks().values().stream()
            .filter(n -> n.getNetworkID().equals(network.getId()))
            .findAny()
            .map(ContainerNetwork::getIpAddress)
            .orElseThrow();
    this.port = container.getPorts()[0].getPrivatePort();
    var multiId = true;
    if (multiId) {
      final var labels = container.getLabels();
      this.secure =
          Boolean.parseBoolean(labels.getOrDefault(prefix + "." + serviceId + ".secure", "false"));
      this.metadata = Util.getMetaDataFromLabels(prefix, serviceId, multiId, labels);
    } else {
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
