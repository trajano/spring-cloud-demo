package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Network;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.event.InstanceRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;

import javax.annotation.PostConstruct;

@Slf4j
@RequiredArgsConstructor
public class DockerServiceInstanceLister {

  private final ApplicationEventPublisher publisher;
  private final DockerClient dockerClient;

  private final DockerDiscoveryConfig dockerDiscoveryConfig;

  private final AtomicReference<Map<String, List<ServiceInstance>>> servicesRef =
      new AtomicReference<>(Map.of());

  public List<ServiceInstance> getInstances(String serviceId) {

    return servicesRef.get().getOrDefault(serviceId, List.of());
  }

  public Set<String> getServices() {

    return servicesRef.get().keySet();
  }

  public void probe() {
    dockerClient.pingCmd().exec();
  }

  /**
   * Initial refresh.  Does not perform publish which causes cycles on startup.
   */
  @PostConstruct
  public void initialRefresh() {
refresh(false);
  }
  /** Refreshes the service list. */
  public void refresh(boolean publish) {

    final var network = getDiscoveryNetwork();

    if (dockerDiscoveryConfig.isSwarmMode()) {
      final var multiIds =
          dockerClient.listServicesCmd().exec().stream()
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(c -> c.getSpec().getLabels().containsKey(dockerDiscoveryConfig.idsLabel()));

      final var singleId =
          dockerClient.listServicesCmd().exec().stream()
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(c -> c.getSpec().getLabels().containsKey(dockerDiscoveryConfig.idLabel()));

      final var services =
          Stream.concat(multiIds, singleId)
              .flatMap(service -> instanceStream(service, network))
              .peek(
                  serviceInstance -> {
                    if (publish) {
                      publisher.publishEvent(new InstanceRegisteredEvent<>(this, serviceInstance));
                    }
                  })
              .collect(Collectors.groupingBy(ServiceInstance::getServiceId));
      servicesRef.set(services);

    } else {

      final var multiIds =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(dockerDiscoveryConfig.idsLabelFilter())
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream();

      final var singleId =
          dockerClient
              .listContainersCmd()
              .withLabelFilter(List.of(dockerDiscoveryConfig.idLabel()))
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream();
      final var containers =
          Stream.concat(multiIds, singleId)
              .distinct()
              .flatMap(container -> instanceStream(container, network))
              .peek(
                  serviceInstance -> {
                    if (publish) {
                      publisher.publishEvent(new InstanceRegisteredEvent<>(this, serviceInstance));
                    }
                  })
              .collect(Collectors.groupingBy(ServiceInstance::getServiceId));
      servicesRef.set(containers);
    }
    log.info("Refreshed service list serviceCount={}", servicesRef.get().size());
  }

  public Network getDiscoveryNetwork() {

    return Util.getDiscoveryNetwork(dockerClient, dockerDiscoveryConfig);
  }

  private Stream<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Service service, Network network) {

    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");

    final var serviceIds =
        Util.getServiceIdsFromLabels(dockerDiscoveryConfig, service.getSpec().getLabels())
            .collect(Collectors.toList());

    return serviceNetworks.stream()
        .filter(n -> n.get("Target").equals(network.getId()))
        .flatMap(n -> ((List<String>) n.get("Aliases")).stream())
        .flatMap(Util::getIpAddresses)
        .flatMap(
            address ->
                serviceIds.stream()
                    .map(
                        serviceId ->
                            new DockerServiceInstance(
                                service,
                                dockerDiscoveryConfig.getLabelPrefix(),
                                serviceId,
                                address)));
  }

  private Stream<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Container container, Network network) {

    return Util.getServiceIdsFromLabels(dockerDiscoveryConfig, container.getLabels())
        .map(
            serviceId ->
                new DockerServiceInstance(
                    container, dockerDiscoveryConfig.getLabelPrefix(), serviceId, network));
  }
}
