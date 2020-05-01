package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.*;
import lombok.extern.slf4j.Slf4j;
import net.trajano.spring.swarm.client.DockerClient2;
import net.trajano.spring.swarm.client.EventType2;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.event.InstanceRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationEventPublisherAware;
import org.springframework.core.env.Environment;

import java.io.Closeable;
import java.io.EOFException;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.github.dockerjava.api.model.EndpointResolutionMode.DNSRR;
import static com.github.dockerjava.api.model.EndpointResolutionMode.VIP;
import static net.trajano.spring.swarm.discovery.DockerSwarmDiscoveryUtil.computeDiscoveryServiceId;

/**
 *
 */
@Slf4j
public class DockerSwarmDiscovery implements InitializingBean, DisposableBean, ApplicationEventPublisherAware {

    private final DockerSwarmDiscoveryProperties properties;

    @Autowired
    private DockerClient2 dockerClient;

    private ApplicationEventPublisher publisher;

    @Autowired
    private Environment environment;

    private Closeable eventsClosable;

    /**
     * List of network <em>IDs</em> to scan.  This does not contain the simple
     * aliases.  Set in {@link #afterPropertiesSet()}.
     */
    private Set<String> networkIDsToScan;

    /**
     * Map from service ID to a list of service instances.
     */
    private ConcurrentMap<String, List<ServiceInstance>> services = new ConcurrentHashMap<>();

    /**
     * Maps a discovery service ID to the Docker service ID.
     */
    private ConcurrentMap<String, String> discoveryToDockerServiceIdMap = new ConcurrentHashMap<>();

    public DockerSwarmDiscovery(final DockerSwarmDiscoveryProperties properties) {
        this.properties = properties;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void afterPropertiesSet() {
        if (properties.hasNetworks()) {
            networkIDsToScan = properties.getNetworks()
                .stream()
                .map(networkName -> dockerClient.inspectNetworkCmd().withNetworkId(networkName).exec())
                .map(Network::getId)
                .collect(Collectors.toSet());
        } else {
            final InspectContainerResponse selfInspect = dockerClient.inspectContainerCmd(environment.getRequiredProperty("HOSTNAME")).exec();
            networkIDsToScan = selfInspect
                .getNetworkSettings()
                .getNetworks()
                .values()
                .parallelStream()
                .map(ContainerNetwork::getNetworkID)
                .collect(Collectors.toSet());
        }
        log.debug("networkIDs to scan={}", networkIDsToScan);
        refreshAllServices();
    }

    private boolean initialRefresh = true;

    private void refreshAllServices() {
        final Instant listServicesExecutedOn = Instant.now();
        log.debug("Refreshing all services on {}", listServicesExecutedOn);

        long count = dockerClient.listServicesCmd()
            .exec()
            .stream()
            .filter(this::isServiceDiscoverable)
            .filter(service -> !isReplicaCountZero(service))
            .mapToLong(this::refresh)
            .sum();
        eventsClosable = buildListener(listServicesExecutedOn);
        if (count > 0 && !initialRefresh) {
            publisher.publishEvent(new InstanceRegisteredEvent<>(this, ""));
        }
        initialRefresh = false;
    }

    private ResultCallback<Event> buildListener(final Instant since) {

        return dockerClient.eventsCmd2()
            .withEventTypeFilter(EventType2.SERVICE)
//            .withSince(DateTimeFormatter.ISO_INSTANT.format(since))
            .withEventFilter(
                "create",
                "update",
                "remove"
            )
            .exec(new ResultCallbackTemplate<>() {

                @Override
                public void onNext(final Event event) {
                    log.trace("event={}", event);
                    final String serviceID = event.getActor().getId();
                    long count = 0;
                    if ("remove".equals(event.getAction())) {
                        count += removeService(serviceID);
                    } else {
                        final Service service = dockerClient.inspectServiceCmd(serviceID).exec();
                        if (isReplicaCountZero(service)) {
                            log.debug("replica count = 0, removing service {}", serviceID);
                            count += removeService(serviceID);
                        } else if (isServiceDiscoverable(service)) {
                            count += refresh(service);
                        } else {
                            count += removeService(serviceID);
                        }
                    }
                    log.debug("{} changes detected, services={}", count, discoveryToDockerServiceIdMap.keySet());
                    if (count > 0) {
                        publisher.publishEvent(new InstanceRegisteredEvent<>(this, serviceID));
                    }
                }

                @Override
                public void onError(final Throwable e) {
                    if (e instanceof EOFException) {
                        refreshAllServices();
                    } else if (e instanceof IllegalStateException && "closed".equals(e.getMessage())) {
                        log.trace("accessing a closed stream, may occur when shutting down", e);
                    } else {
                        log.error("Stream error", e);
                    }
                }
            });
    }

    /**
     * Assuming the mode is replicated then returns true if count is zero.
     *
     * @param service service
     * @return count is zero
     */
    private boolean isReplicaCountZero(Service service) {
        final ServiceModeConfig serviceMode = service.getSpec().getMode();
        return serviceMode.getMode() == ServiceMode.REPLICATED &&
            serviceMode.getReplicated().getReplicas() == 0L;
    }

    /**
     * Remove a service.
     *
     * @param dockerServiceID docker service ID
     * @return number of instances that were removed.
     */
    private long removeService(final String dockerServiceID) {
        discoveryToDockerServiceIdMap
            .entrySet()
            .stream()
            .filter(e -> dockerServiceID.equals(e.getValue())).findAny()
            .map(Map.Entry::getKey)
            .ifPresent(s -> discoveryToDockerServiceIdMap.remove(s, dockerServiceID));
        final List<ServiceInstance> remove = services.remove(dockerServiceID);
        if (remove == null) {
            return 0L;
        } else {
            return remove.size();
        }
    }

    /**
     * Refresh a single service.
     *
     * @param service service
     * @return number of instances created
     */
    private long refresh(final Service service) {
        final Stream<? extends ServiceInstance> instanceStream;
        if (service.getSpec().getEndpointSpec().getMode() == VIP) {
            instanceStream = getServiceInstancesVip(service);
        } else if (service.getSpec().getEndpointSpec().getMode() == DNSRR) {
            instanceStream = getServiceInstancesDnsRR(service);
        } else {
            throw new IllegalArgumentException(String.format("Unsupported mode %s", service.getSpec().getEndpointSpec().getMode()));
        }
        discoveryToDockerServiceIdMap.put(computeDiscoveryServiceId(service), service.getId());
        final List<ServiceInstance> instances = instanceStream.collect(Collectors.toList());
        services.put(service.getId(), instances);
        return instances.size();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void destroy() throws IOException {
        if (eventsClosable != null) {
            eventsClosable.close();
        }
    }

    public List<ServiceInstance> getInstances(final String discoveryServiceID) {
        final String dockerServiceID = discoveryToDockerServiceIdMap.get(discoveryServiceID);
        if (dockerServiceID == null) {
            return List.of();
        }
        return services.computeIfAbsent(dockerServiceID, v -> List.of());
    }

    public Set<String> getServices() {
        return discoveryToDockerServiceIdMap.keySet();
    }

    private boolean isServiceDiscoverable(Service service) {
        final Map<String, String> labels = service.getSpec().getLabels();
        final String discoverable = labels.get("spring.service.discoverable");
        if ("false".equals(discoverable)) {
            return false;
        } else if ("true".equals(discoverable)) {
            return true;
        } else {
            return labels.containsKey("spring.service.id");
        }
    }

    private Stream<? extends ServiceInstance> getServiceInstancesVip(final Service dockerService) {

        final EndpointVirtualIP[] virtualIPs = dockerService.getEndpoint().getVirtualIPs();
        if (virtualIPs == null) {
            return Stream.empty();
        }
        return Arrays.stream(virtualIPs)
            .filter(endpointVirtualIP -> networkIDsToScan.contains(endpointVirtualIP.getNetworkID()))
            .map(endpointVirtualIP -> endpointVirtualIP.getAddr().split("/")[0])
            .map(ipAddress -> new DockerSwarmServiceInstance(dockerService, ipAddress));
    }

    /**
     * Build the service instance when endpoint mode is DNSRR.  When DNSRR is enabled, the IP address cannot be
     * determined from the service spec and Docker does not notify when the Tasks are up as such only the
     * DNS name is used as the host which also means that every request will incur a DNS lookup.
     *
     * @param dockerService docker service
     * @return service instance stream
     */
    private Stream<? extends ServiceInstance> getServiceInstancesDnsRR(final Service dockerService) {

        final List<NetworkAttachmentConfig> taskNetworks = dockerService.getSpec().getTaskTemplate().getNetworks();

        return taskNetworks
            .parallelStream()
            .filter(n -> networkIDsToScan.contains(n.getTarget()))
            .map(NetworkAttachmentConfig::getAliases)
            .flatMap(Collection::stream)
            .distinct()
            .map(alias -> new DockerSwarmServiceInstance(dockerService, alias));

    }

    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }
}
