package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Network;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

@Slf4j
@Component
public class DockerReactiveDiscoveryClient implements ReactiveDiscoveryClient {

    private final DockerClient dockerClient;

    private final String prefix = "docker";

    private final String networkFilter = "services";

    private final boolean swarmMode = false;

    public DockerReactiveDiscoveryClient(DockerClient dockerClient) {

        this.dockerClient = dockerClient;

    }


    @Override
    public String description() {

        return "DockerReactiveDiscoveryClient";
    }

    @Override
    public Flux<ServiceInstance> getInstances(final String serviceId) {

        final var network = getDiscoveryNetwork();

        if (swarmMode) {
            // at this point find all the services that
            return Flux.fromIterable(List.of());

        } else {
            // at this point find all the containers that have a given service ID
            final var multiIds = dockerClient.listContainersCmd()
                    .withLabelFilter(List.of(prefix + ".ids"))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .filter(c -> Set.of(c.getLabels().get(prefix + ".ids").split(",")).contains(serviceId));

            final var singleId = dockerClient.listContainersCmd()
                    .withLabelFilter(Map.of(prefix + ".id", serviceId))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream();
            final var containers = Stream.concat(multiIds, singleId).distinct();
            return Flux.fromStream(containers
                    .map(container -> new ContainerServiceInstance(container, prefix, serviceId, network)));
        }
    }

    @Override
    public Flux<String> getServices() {

        final var network = getDiscoveryNetwork();
        if (swarmMode) {
            final var services = dockerClient.listServicesCmd()
                    .exec()
                    .stream()
                    .filter(service -> service.getSpec().getLabels().containsKey(prefix + ".ids") || service.getSpec().getLabels().containsKey(prefix + ".id"))
                    .filter(service -> service.getSpec().getNetworks().contains(network))
                    .flatMap(service ->
                            Stream.concat(
                                    Stream.of(service.getSpec().getLabels().get(prefix + ".ids").split(",")),
                                    service.getSpec().getLabels().containsKey(prefix + ".id") ? Stream.of(service.getSpec().getLabels().get(prefix + ".id")) : Stream.empty()
                            )
                    )
                    .distinct();
            return Flux.fromStream(services);
        } else {
            final var multiIds = dockerClient.listContainersCmd()
                    .withLabelFilter(List.of(prefix + ".ids"))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .map(c -> c.getLabels().get(prefix + ".ids"))
                    .flatMap(ids -> Stream.of(ids.split(",")));

            final var singleId = dockerClient.listContainersCmd()
                    .withLabelFilter(List.of(prefix + ".id"))
                    .withNetworkFilter(List.of(network.getId()))
                    .exec()
                    .stream()
                    .map(c -> c.getLabels().get(prefix + ".id"));

            return Flux.fromStream(Stream.concat(multiIds, singleId).distinct());
        }
    }

    private Network getDiscoveryNetwork() {

        return dockerClient.listNetworksCmd()
                .withNameFilter(networkFilter)
                .exec()
                .stream()
                .filter(n -> n.getName().equals(networkFilter))
                .findAny()
                .orElseThrow();
    }

}
