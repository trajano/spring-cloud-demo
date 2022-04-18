package net.trajano.swarm.gateway.loadbalancer;

import static net.trajano.swarm.gateway.discovery.Util.getDiscoveryNetwork;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Network;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.discovery.DockerDiscoveryConfig;
import net.trajano.swarm.gateway.discovery.DockerServiceInstance;
import net.trajano.swarm.gateway.discovery.Util;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import reactor.core.publisher.Flux;

@Slf4j
public class DockerServiceInstanceListSupplier implements ServiceInstanceListSupplier {

  private final DockerClient dockerClient;

  private final DockerDiscoveryConfig config;

  public DockerServiceInstanceListSupplier(
      final DockerClient dockerClient, final DockerDiscoveryConfig config) {

    this.dockerClient = dockerClient;
    this.config = config;
  }

  @Override
  public Flux<List<ServiceInstance>> get() {

    return Flux.generate(
        listSynchronousSink -> {
          log.info("start");
          final var network = getDiscoveryNetwork(dockerClient, config);

          if (config.isSwarmMode()) {
            final var multiIds =
                dockerClient.listServicesCmd().exec().stream()
                    .filter(c -> c.getSpec().getLabels() != null)
                    .filter(c -> c.getSpec().getLabels().containsKey(config.idsLabel()));

            final var singleId =
                dockerClient.listServicesCmd().exec().stream()
                    .filter(c -> c.getSpec().getLabels() != null)
                    .filter(c -> c.getSpec().getLabels().containsKey(config.idLabel()));

            final var services = Stream.concat(multiIds, singleId);

            listSynchronousSink.next(
                services
                    .flatMap(service -> instanceStream(service, network))
                    .collect(Collectors.toList()));
            log.info("end");

          } else {

            //                final var multiIds = dockerClient.listContainersCmd()
            //                        .withLabelFilter(config.idsLabelFilter())
            //                        .withNetworkFilter(List.of(network.getId()))
            //                        .exec()
            //                        .stream();
            //
            //                final var singleId = dockerClient.listContainersCmd()
            //                        .withNetworkFilter(List.of(network.getId()))
            //                        .exec()
            //                        .stream();
            //                final var containers = Stream.concat(multiIds, singleId).distinct();
            //                return Flux.fromStream(containers
            //                        .map(container -> new ContainerServiceInstance(container,
            // config.getLabelPrefix(), serviceId, network)));
          }
        });
  }

  private Stream<ServiceInstance> instanceStream(
      com.github.dockerjava.api.model.Service service, Network network) {

    final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
    final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
    final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");

    final var serviceIds =
        Util.getServiceIdsFromLabels(config, service.getSpec().getLabels())
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
                                service, config.getLabelPrefix(), serviceId, address)));
  }

  @Override
  public String getServiceId() {

    System.out.println("SERVICEID");
    return null;
  }
}
