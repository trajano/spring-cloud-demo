package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.EndpointResolutionMode;
import com.github.dockerjava.api.model.Network;
import com.github.dockerjava.api.model.Service;
import com.github.dockerjava.api.model.ServiceSpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.util.*;
import java.util.stream.Stream;

@Slf4j
@Component
public class DockerReactiveDiscoveryClient implements ReactiveDiscoveryClient {

    private final DockerClient dockerClient;

    private final DockerDiscoveryConfig config;

    public DockerReactiveDiscoveryClient(
            final DockerClient dockerClient,
            final DockerDiscoveryConfig config) {

        this.dockerClient = dockerClient;
        this.config = config;

    }


    @Override
    public String description() {

        return "DockerReactiveDiscoveryClient";
    }

    @Override
    public Flux<ServiceInstance> getInstances(final String serviceId) {

        final var network = getDiscoveryNetwork();

        if (config.isSwarmMode()) {
            final var multiIds = dockerClient.listServicesCmd()
                    .exec()
                    .stream()
                    .filter(c -> c.getSpec().getLabels() != null)
                    .filter(c -> c.getSpec().getLabels().containsKey(config.idsLabel()))
                    .filter(c -> Set.of(c.getSpec().getLabels().get(config.idsLabel()).split(",")).contains(serviceId));

            final var singleId = dockerClient.listServicesCmd()
                    .exec()
                    .stream()
                    .filter(c -> c.getSpec().getLabels() != null)
                    .filter(c -> c.getSpec().getLabels().containsKey(config.idLabel()))
                    .filter(c -> c.getSpec().getLabels().get(config.idLabel()).equals(serviceId));

            final var services = Stream.concat(multiIds, singleId);

            return Flux.fromStream(services
                    .flatMap(service -> instanceStream(service, serviceId, network)));

        } else {

            final var multiIds = dockerClient.listContainersCmd()
                    .withLabelFilter(config.idsLabelFilter())
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .filter(c -> Set.of(c.getLabels().get(config.idsLabel()).split(",")).contains(serviceId));

            final var singleId = dockerClient.listContainersCmd()
                    .withLabelFilter(Map.of(config.idLabel(), serviceId))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream();
            final var containers = Stream.concat(multiIds, singleId).distinct();
            return Flux.fromStream(containers
                    .map(container -> new ContainerServiceInstance(container, config.getLabelPrefix(), serviceId, network)));
        }
    }

    private Stream<ServiceInstance> instanceStream(Service service, String serviceId, Network network) {

        final var spec = (Map<String, Object>) service.getRawValues().get("Spec");
        final var taskTemplate = (Map<String, Object>) spec.get("TaskTemplate");
        final var serviceNetworks = (List<Map<String, Object>>) taskTemplate.get("Networks");
        return serviceNetworks.stream()
                .filter(n -> n.get("Target").equals(network.getId()))
                .map(n -> (List<String>) n.get("Aliases"))
                .map(l -> l.get(0))
                .flatMap(alias -> {
                    try {
                        return Stream.of(InetAddress.getAllByName(alias));
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                })
                .map(InetAddress::getHostAddress)
                .peek(System.out::println)
                .map(address -> new DockerServiceInstance(service, config.getLabelPrefix(), serviceId, address))
                ;

    }

    @Override
    public Flux<String> getServices() {

        final var network = getDiscoveryNetwork();
        if (config.isSwarmMode()) {
            final var services = dockerClient.listServicesCmd()
                    .exec()
                    .stream()
                    .map(Service::getSpec)
                    .filter(Objects::nonNull)
                    .map(ServiceSpec::getLabels)
                    .filter(Objects::nonNull)
                    .filter(labels -> labels.containsKey(config.idsLabel()) || labels.containsKey(config.idLabel()))
                    .flatMap(labels ->
                            Stream.concat(
                                    Stream.of(labels.get(config.idsLabel()).split(",")),
                                    labels.containsKey(config.idLabel()) ? Stream.of(labels.get(config.idLabel())) : Stream.empty()
                            )
                    )
                    .distinct();
            return Flux.fromStream(services);
        } else {
            final var multiIds = dockerClient.listContainersCmd()
                    .withLabelFilter(config.idsLabelFilter())
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .map(c -> c.getLabels().get(config.idsLabel()))
                    .flatMap(ids -> Stream.of(ids.split(",")));

            final var singleId = dockerClient.listContainersCmd()
                    .withLabelFilter(List.of(config.idLabel()))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .map(c -> c.getLabels().get(config.idLabel()));

            return Flux.fromStream(Stream.concat(multiIds, singleId).distinct());
        }
    }

    private boolean swarmEndpointFilter(Service service, Network network) {

        if (Objects.requireNonNull(service.getEndpoint()).getSpec().getMode() == EndpointResolutionMode.VIP) {
            System.out.println(service.getEndpoint().getRawValues());
            return true;
        } else {
            return true;
        }

    }

    private Network getDiscoveryNetwork() {

        return dockerClient.listNetworksCmd()
                .withNameFilter(config.getNetwork())
                .exec()
                .stream()
                .filter(n -> n.getName().equals(config.getNetwork()))
                .findAny()
                .orElseThrow();
    }

}
