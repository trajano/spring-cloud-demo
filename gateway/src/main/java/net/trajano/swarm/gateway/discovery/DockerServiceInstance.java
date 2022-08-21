package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.*;
import java.net.URI;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.Data;
import org.springframework.cloud.client.ServiceInstance;

@Data
public class DockerServiceInstance implements ServiceInstance {

  private final String serviceId;

  private final String host;

  private final int port;

  private final Map<String, String> metadata;

  private final boolean secure;
  private final String protocol;

  private final URI uri;

  public DockerServiceInstance(Service service, String labelPrefix, String serviceId, String host) {

    this.serviceId = serviceId;
    this.host = host;
    final var labels =
        Optional.ofNullable(service.getSpec()).map(ServiceSpec::getLabels).orElse(Map.of());
    var multiId = labels.containsKey("%s.ids".formatted(labelPrefix));
    if (multiId) {
      this.port =
          Integer.parseInt(
              labels.getOrDefault("%s.%s.port".formatted(labelPrefix, serviceId), "8080"));
      this.secure =
          Optional.ofNullable(labels.get("%s.%s.secure".formatted(labelPrefix, serviceId)))
              .map(Boolean::parseBoolean)
              .orElse(false);
      this.protocol =
          labels.getOrDefault("%s.%s.protocol".formatted(labelPrefix, serviceId), "http");
    } else {
      this.port = Integer.parseInt(labels.getOrDefault("%s.port".formatted(labelPrefix), "8080"));
      this.secure =
          Boolean.parseBoolean(labels.getOrDefault("%s.secure".formatted(labelPrefix), "false"));
      this.protocol = "http";
    }
    this.metadata = Util.getMetaDataFromLabels(labelPrefix, serviceId, multiId, labels);
    if ("http".equals(protocol) && secure) {
      this.uri = URI.create("https://" + host + ":" + port);
    } else if ("http".equals(protocol)) {
      this.uri = URI.create("http://" + host + ":" + port);
    } else if ("grpc".equals(protocol) && !secure) {
      this.uri = URI.create("grpc://" + host + ":" + port);
    } else {
      throw new IllegalArgumentException(
          "Unsupported protocol %s and secure %s".formatted(protocol, secure));
    }
  }

  public DockerServiceInstance(
      Container container, String labelPrefix, String serviceId, Network network) {

    this.serviceId = serviceId;

    this.host =
        Optional.ofNullable(container.getNetworkSettings())
            .map(ContainerNetworkSettings::getNetworks)
            .map(Map::values)
            .orElseThrow()
            .stream()
            .filter(n -> Objects.equals(n.getNetworkID(), network.getId()))
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
      this.protocol =
          labels.getOrDefault("%s.%s.protocol".formatted(labelPrefix, serviceId), "http");
    } else {
      this.secure = Boolean.parseBoolean(labels.getOrDefault(labelPrefix + ".secure", "false"));
      this.protocol = "http";
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
