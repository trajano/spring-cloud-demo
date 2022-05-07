package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Network;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.docker.ReactiveDockerClient;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.event.InstanceRegisteredEvent;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;

@Slf4j
public class DockerServiceInstanceLister implements ApplicationListener<ContextClosedEvent> {

  private final ApplicationEventPublisher publisher;
  private final ReactiveDockerClient dockerClient;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;
  private final DockerEventWatcher dockerEventWatcher;
  private final AtomicReference<Map<String, List<ServiceInstance>>> servicesRef =
      new AtomicReference<>(Map.of());

  @Getter private volatile boolean closing = false;

  public DockerServiceInstanceLister(
      ApplicationEventPublisher publisher,
      ReactiveDockerClient dockerClient,
      DockerDiscoveryProperties dockerDiscoveryProperties) {

    this.publisher = publisher;
    this.dockerClient = dockerClient;
    this.dockerDiscoveryProperties = dockerDiscoveryProperties;
    dockerEventWatcher = new DockerEventWatcher(this, dockerDiscoveryProperties, dockerClient);
  }

  public Network getDiscoveryNetwork() {

    return Util.getDiscoveryNetwork(dockerClient.blockingClient(), dockerDiscoveryProperties);
  }

  public List<ServiceInstance> getInstances(String serviceId) {

    return servicesRef.get().getOrDefault(serviceId, List.of());
  }

  public Set<String> getServices() {

    return servicesRef.get().keySet();
  }

  /** Initial refresh. Does not perform publish which causes cycles on startup. */
  @PostConstruct
  public void initialRefresh() {
    refresh(false);
    dockerEventWatcher.startWatching();
  }

  @SuppressWarnings("unchecked")
  private Stream<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Service service, Network network) {

    if (closing) {
      return Stream.empty();
    }
    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");

    final var serviceIds =
        Util.getServiceIdsFromLabels(dockerDiscoveryProperties, service.getSpec().getLabels())
            .toList();

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
                                dockerDiscoveryProperties.getLabelPrefix(),
                                serviceId,
                                address)));
  }

  private Stream<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Container container, Network network) {

    return Util.getServiceIdsFromLabels(dockerDiscoveryProperties, container.getLabels())
        .flatMap(
            serviceId -> {
              if (closing) {
                return Stream.empty();
              }
              try {
                return Stream.of(
                    new DockerServiceInstance(
                        container, dockerDiscoveryProperties.getLabelPrefix(), serviceId, network));
              } catch (IllegalStateException e) {
                log.error("unable to build instance, likely context is closing {}", e.getMessage());
                return Stream.empty();
              }
            });
  }

  @Override
  public void onApplicationEvent(ContextClosedEvent event) {

    log.trace("context closing in lister: {}", event);
    closing = true;
    dockerEventWatcher.stopWatching();
  }

  public void probe() {
    dockerClient.blockingClient().pingCmd().exec();
  }

  /** Refreshes the service list. */
  public void refresh(boolean publish) {
    log.trace("refreshing");
    final Set<ServiceInstance> toPublish = new HashSet<>();
    final var network = getDiscoveryNetwork();

    final Stream<ServiceInstance> serviceInstanceStream;
    if (dockerDiscoveryProperties.isSwarmMode()) {
      final var multiIds =
          dockerClient.blockingClient().listServicesCmd().exec().stream()
              .filter(c -> c.getSpec() != null)
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(
                  c -> c.getSpec().getLabels().containsKey(dockerDiscoveryProperties.idsLabel()));

      final var singleId =
          dockerClient.blockingClient().listServicesCmd().exec().stream()
              .filter(c -> c.getSpec() != null)
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(
                  c -> c.getSpec().getLabels().containsKey(dockerDiscoveryProperties.idLabel()));

      serviceInstanceStream =
          Stream.concat(multiIds, singleId).flatMap(service -> instanceStream(service, network));

    } else {

      final var multiIds =
          dockerClient
              .blockingClient()
              .listContainersCmd()
              .withLabelFilter(dockerDiscoveryProperties.idsLabelFilter())
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream();

      final var singleId =
          dockerClient
              .blockingClient()
              .listContainersCmd()
              .withLabelFilter(List.of(dockerDiscoveryProperties.idLabel()))
              .withNetworkFilter(List.of(network.getId()))
              .exec()
              .stream();
      serviceInstanceStream =
          Stream.concat(multiIds, singleId)
              .distinct()
              .flatMap(container -> instanceStream(container, network));
    }

    final var mapOfServiceInstances =
        serviceInstanceStream
            .peek(toPublish::add)
            .collect(Collectors.groupingBy(ServiceInstance::getServiceId));
    servicesRef.set(mapOfServiceInstances);
    log.info(
        "Refreshed serviceCount={} publish={} closing={}",
        servicesRef.get().size(),
        publish,
        closing);

    if (publish && !closing) {
      log.info("publishing serviceCount={}", servicesRef.get().size());
      toPublish.forEach(
          serviceInstance ->
              publisher.publishEvent(new InstanceRegisteredEvent<>(this, serviceInstance)));
      publisher.publishEvent(new RefreshRoutesEvent(this));
    }
  }
}
