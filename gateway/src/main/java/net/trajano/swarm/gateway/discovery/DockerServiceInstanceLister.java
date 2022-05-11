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
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
public class DockerServiceInstanceLister implements ApplicationListener<ContextClosedEvent> {

  private final ApplicationEventPublisher publisher;
  private final ReactiveDockerClient dockerClient;

  private final DockerDiscoveryProperties dockerDiscoveryProperties;
  private final DockerEventWatcher dockerEventWatcher;
  private final AtomicReference<Map<String, List<ServiceInstance>>> servicesRef =
      new AtomicReference<>(Map.of());

  @Getter private volatile boolean closing = false;

  private Disposable refreshSubscription;

  public DockerServiceInstanceLister(
      ApplicationEventPublisher publisher,
      ReactiveDockerClient dockerClient,
      DockerDiscoveryProperties dockerDiscoveryProperties) {

    this.publisher = publisher;
    this.dockerClient = dockerClient;
    this.dockerDiscoveryProperties = dockerDiscoveryProperties;
    dockerEventWatcher = new DockerEventWatcher(this, dockerDiscoveryProperties, dockerClient);
  }

  public Mono<Network> getDiscoveryNetwork() {

    return dockerClient
        .networks(
            dockerClient.listNetworksCmd().withNameFilter(dockerDiscoveryProperties.getNetwork()))
        .filter(n -> n.getName().equals(dockerDiscoveryProperties.getNetwork()))
        .next();
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
  private Flux<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Service service, Network network) {

    if (closing) {
      return Flux.empty();
    }
    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");

    final var serviceIds =
        Util.getServiceIdsFromLabels(dockerDiscoveryProperties, service.getSpec().getLabels())
            .toList();

    return Flux.fromStream(
        serviceNetworks.stream()
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
                                    address))));
  }

  private Flux<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Container container, Network network) {

    return Flux.fromStream(
        Util.getServiceIdsFromLabels(dockerDiscoveryProperties, container.getLabels())
            .flatMap(
                serviceId -> {
                  if (closing) {
                    return Stream.empty();
                  }
                  try {
                    return Stream.of(
                        new DockerServiceInstance(
                            container,
                            dockerDiscoveryProperties.getLabelPrefix(),
                            serviceId,
                            network));
                  } catch (IllegalStateException e) {
                    log.error(
                        "unable to build instance, likely context is closing {}", e.getMessage());
                    return Stream.empty();
                  }
                }));
  }

  @Override
  public void onApplicationEvent(ContextClosedEvent event) {

    log.trace("context closing in lister: {}", event);
    closing = true;
    dockerEventWatcher.stopWatching();
    refreshSubscription.dispose();
  }

  public void probe() {
    dockerClient.blockingClient().pingCmd().exec();
  }

  /** Refreshes the service list. */
  public void refresh(boolean publish) {
    log.trace("refreshing publish={}", publish);
    final Mono<Network> networkMono = getDiscoveryNetwork();

    final Flux<ServiceInstance> serviceInstanceFlux;
    if (dockerDiscoveryProperties.isSwarmMode()) {
      final var multiIds =
          dockerClient
              .services()
              .filter(c -> c.getSpec() != null)
              .filter(c -> Objects.requireNonNull(c.getSpec()).getLabels() != null)
              .filter(
                  c ->
                      Objects.requireNonNull(Objects.requireNonNull(c.getSpec()).getLabels())
                          .containsKey(dockerDiscoveryProperties.idsLabel()));

      final var singleId =
          dockerClient
              .services()
              .filter(c -> c.getSpec() != null)
              .filter(c -> c.getSpec().getLabels() != null)
              .filter(
                  c -> c.getSpec().getLabels().containsKey(dockerDiscoveryProperties.idLabel()));

      serviceInstanceFlux =
          networkMono.flatMapMany(
              network ->
                  Flux.concat(multiIds, singleId)
                      .distinct()
                      .flatMap(service -> instanceStream(service, network)));

    } else {

      serviceInstanceFlux =
          networkMono.flatMapMany(
              network -> {
                final var multiIds =
                    dockerClient.containers(
                        dockerClient
                            .listContainersCmd()
                            .withLabelFilter(dockerDiscoveryProperties.idsLabelFilter())
                            .withNetworkFilter(List.of(network.getId())));

                final var singleId =
                    dockerClient.containers(
                        dockerClient
                            .listContainersCmd()
                            .withLabelFilter(List.of(dockerDiscoveryProperties.idLabel()))
                            .withNetworkFilter(List.of(network.getId())));

                return Flux.concat(multiIds, singleId)
                    .distinct()
                    .flatMap(container -> instanceStream(container, network));
              });
    }

    refreshSubscription =
        serviceInstanceFlux
            .collect(Collectors.groupingBy(ServiceInstance::getServiceId))
            // don't bother doing anything if it is the same
            .flatMap(
                next -> {
                  if (next.equals(servicesRef.get())) {
                    return Mono.empty();
                  } else {
                    servicesRef.set(next);
                    return Mono.just(next);
                  }
                })
            .filter(i -> publish)
            .map(Map::values)
            .flatMapMany(Flux::fromIterable)
            .flatMap(Flux::fromIterable)
            .map(
                serviceInstance -> {
                  publisher.publishEvent(new InstanceRegisteredEvent<>(this, serviceInstance));
                  return true;
                })
            .collectList()
            .map(
                ignored -> {
                  publisher.publishEvent(new RefreshRoutesEvent(this));
                  return true;
                })
            // silently drop errors, if there is an error it just means there's nothing to subscribe
            // to
            .onErrorReturn(false)
            .subscribe();
  }
}
