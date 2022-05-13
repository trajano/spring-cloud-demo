package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Network;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CancellationException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
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
import org.xbill.DNS.*;
import org.xbill.DNS.lookup.LookupSession;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

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

  private Executor dnsExecutor = Executors.newSingleThreadExecutor();

  public DockerServiceInstanceLister(
      ApplicationEventPublisher publisher,
      ReactiveDockerClient dockerClient,
      DockerDiscoveryProperties dockerDiscoveryProperties) {

    this.publisher = publisher;
    this.dockerClient = dockerClient;
    this.dockerDiscoveryProperties = dockerDiscoveryProperties;

    dockerEventWatcher = new DockerEventWatcher(this, dockerDiscoveryProperties, dockerClient);
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
  }

  @SuppressWarnings("unchecked")
  private Flux<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Service service, Network network) {

    if (closing) {
      return Flux.empty();
    }
    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var mode = (Map<String, Object>) service.getRawValues().get("Mode");
    // don't bother doing anything if the replica count is zero.
    if (mode != null && mode.containsKey("Replicated")) {
      final Map<String, Object> replicated = (Map<String, Object>) mode.get("Replicated");
      if (replicated.get("Replicas").equals(0)) {
        return Flux.empty();
      }
    }

    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");

    final var serviceIds =
        Util.getServiceIdsFromLabels(dockerDiscoveryProperties, service.getSpec().getLabels())
            .toList();

    return Flux.fromIterable(serviceNetworks)
        .log()
        .filter(stringObjectMap -> network.getId().equals(stringObjectMap.get("Target")))
        .flatMap(n -> Flux.fromIterable((List<String>) n.get("Aliases")))
        .flatMap(this::getIpAddressesFlux)
        .log()
        .flatMap(
            address ->
                Flux.fromStream(
                    serviceIds.stream()
                        .map(
                            serviceId ->
                                new DockerServiceInstance(
                                    service,
                                    dockerDiscoveryProperties.getLabelPrefix(),
                                    serviceId,
                                    address))));
    //    return Flux.fromStream(
    //        serviceNetworks.stream()
    //            .filter(n -> n.get("Target").equals(network.getId()))
    //            .flatMap(n -> ((List<String>) n.get("Aliases")).stream())
    //            .flatMap(Util::getIpAddresses)
    //            .flatMap(
    //                address ->
    //                    serviceIds.stream()
    //                        .map(
    //                            serviceId ->
    //                                new DockerServiceInstance(
    //                                    service,
    //                                    dockerDiscoveryProperties.getLabelPrefix(),
    //                                    serviceId,
    //                                    address))));
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
    final Network network =
        Util.getDiscoveryNetwork(dockerClient.blockingClient(), dockerDiscoveryProperties);

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
          Flux.concat(multiIds, singleId)
              .distinct()
              .flatMap(service -> instanceStream(service, network));

    } else {

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

      serviceInstanceFlux =
          Flux.concat(multiIds, singleId)
              .distinct()
              .flatMap(container -> instanceStream(container, network));
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
            .map(Map::values)
            .flatMapMany(Flux::fromIterable)
            .flatMap(Flux::fromIterable)
            .collectList()
            // When shutting down CancellationException may get raised this will prevent publication
            .onErrorReturn(CancellationException.class, List.of())
            .subscribe(
                serviceInstances -> {
                  if (publish) {

                    serviceInstances.forEach(
                        serviceInstance ->
                            publisher.publishEvent(
                                new InstanceRegisteredEvent<>(this, serviceInstance)));
                    if (!serviceInstances.isEmpty()) {
                      publisher.publishEvent(new RefreshRoutesEvent(this));
                    }
                  } else {
                    dockerEventWatcher.startWatching();
                  }
                });
  }

  private Flux<String> getIpAddressesFlux(String hostname) {

    final var name = Name.fromConstantString(hostname);
    return Mono.fromCallable(
            () -> {
              try {
                var resolver = new SimpleResolver();
                //                resolver.setTCP(true);
                resolver.setTimeout(Duration.ofSeconds(5));
                return resolver;
              } catch (UnknownHostException e) {
                throw new UncheckedIOException(e);
              }
            })
        .map(
            resolver ->
                LookupSession.defaultBuilder()
                    .ndots(0)
                    .clearCaches()
                    .resolver(resolver)
                    .executor(dnsExecutor)
                    .build())
        .flatMap(s -> Mono.fromCompletionStage(s.lookupAsync(name, Type.A)))
        .publishOn(Schedulers.boundedElastic())
        .flatMapMany(result -> Flux.fromIterable(result.getRecords()))
        .map(ARecord.class::cast)
        .map(ARecord::getAddress)
        .map(InetAddress::getHostAddress)
        .switchIfEmpty(Flux.just(hostname))
        .doOnError(throwable -> log.error("Got {} looking up {}", throwable, hostname))
        .onErrorReturn(hostname);
  }
}
