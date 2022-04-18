package net.trajano.swarm.gateway.discovery;

import static net.trajano.swarm.gateway.discovery.Util.getDiscoveryNetwork;
import static net.trajano.swarm.gateway.discovery.Util.getServiceIdsFromLabels;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Network;
import com.github.dockerjava.api.model.Service;
import com.github.dockerjava.api.model.ServiceSpec;
import java.util.*;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import reactor.core.publisher.Flux;

@Slf4j
public class DockerReactiveDiscoveryClient implements ReactiveDiscoveryClient {

  private final DockerClient dockerClient;

  private final DockerDiscoveryConfig config;

  public DockerReactiveDiscoveryClient(
      final DockerClient dockerClient, final DockerDiscoveryConfig config) {

    this.dockerClient = dockerClient;
    this.config = config;
  }

  @Override
  public String description() {

    return "DockerReactiveDiscoveryClient";
  }

  @Override
  public Flux<ServiceInstance> getInstances(final String serviceId) {

    if (serviceId == null) {
      return Flux.empty();
    }
    final var network = getDiscoveryNetwork(dockerClient, config);

    if (config.isSwarmMode()) {
      final var multiIds =
          dockerClient.listServicesCmd().exec().stream()
              .filter(c -> c.getSpec() != null)
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(c -> c.getSpec().getLabels().containsKey(config.idsLabel()))
              .filter(
                  c ->
                      Arrays.asList(c.getSpec().getLabels().get(config.idsLabel()).split(","))
                          .contains(serviceId));

      final var singleId =
          dockerClient.listServicesCmd().exec().stream()
              .filter(c -> c.getSpec() != null)
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(c -> c.getSpec().getLabels().containsKey(config.idLabel()))
              .filter(c -> c.getSpec().getLabels().get(config.idLabel()).equals(serviceId));

      final var services = Stream.concat(multiIds, singleId);

      log.error("get instances {}", serviceId);
      return Flux.fromStream(
          services.flatMap(service -> instanceStream(service, serviceId, network)));

    } else {

      final var multiIds =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(config.idsLabelFilter())
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream()
              .filter(
                  c -> Set.of(c.getLabels().get(config.idsLabel()).split(",")).contains(serviceId));

      final var singleId =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(Map.of(config.idLabel(), serviceId))
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream();
      final var containers = Stream.concat(multiIds, singleId).distinct();
      return Flux.fromStream(
          containers.map(
              container ->
                  new ContainerServiceInstance(
                      container, config.getLabelPrefix(), serviceId, network)));
    }
  }

  private Stream<? extends ServiceInstance> instanceStream(
      final Service service, final String serviceId, final Network network) {

    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");
    return serviceNetworks.stream()
        .filter(n -> n.get("Target").equals(network.getId()))
        .flatMap(n -> ((List<String>) n.get("Aliases")).stream())
        .flatMap(Util::getIpAddresses)
        .map(
            address ->
                new DockerServiceInstance(service, config.getLabelPrefix(), serviceId, address))
        .peek(instance -> log.debug("registered {}", instance));
  }

  @Override
  public Flux<String> getServices() {

    final var network = getDiscoveryNetwork(dockerClient, config);
    if (config.isSwarmMode()) {
      final var services =
          dockerClient.listServicesCmd().exec().stream()
              .map(Service::getSpec)
              .filter(Objects::nonNull)
              .map(ServiceSpec::getLabels)
              .filter(Objects::nonNull)
              .filter(
                  labels ->
                      labels.containsKey(config.idsLabel()) || labels.containsKey(config.idLabel()))
              .flatMap(labels -> getServiceIdsFromLabels(config, labels))
              .distinct();
      return Flux.fromStream(services);
    } else {
      final var multiIds =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(config.idsLabelFilter())
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream()
              .map(Container::getLabels)
              .flatMap(labels -> getServiceIdsFromLabels(config, labels));

      final var singleId =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(List.of(config.idLabel()))
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream()
              .map(Container::getLabels)
              .flatMap(labels -> getServiceIdsFromLabels(config, labels));

      return Flux.fromStream(Stream.concat(multiIds, singleId).distinct());
    }
  }
}
