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
import org.springframework.cloud.client.DefaultServiceInstance;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.Closeable;
import java.io.EOFException;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.github.dockerjava.api.model.EndpointResolutionMode.DNSRR;
import static com.github.dockerjava.api.model.EndpointResolutionMode.VIP;

@Slf4j
public class DockerSwarmDiscoveryClient implements DiscoveryClient, InitializingBean, DisposableBean {

    @Autowired
    private DockerClient2 dockerClient;

    /**
     * Specifies a comma separated list of networks to look for services that contain the service labels.
     * If not specified it will use all the networks that the container has access to.
     */
    private String dockerDiscoveryNetworks;

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

    public DockerSwarmDiscoveryClient(DockerClient2 dockerClient, String dockerDiscoveryNetworks, Environment environment) {
        this.dockerClient = dockerClient;
        this.dockerDiscoveryNetworks = dockerDiscoveryNetworks;
        this.environment = environment;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void afterPropertiesSet() {

        if (dockerDiscoveryNetworks != null) {
            networkIDsToScan = Arrays
                .stream(dockerDiscoveryNetworks.split(","))
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

        refreshAllServices();
    }

    private void refreshAllServices() {
        final Instant listServicesExecutedOn = Instant.now();
        log.debug("Refreshing all services on {}", listServicesExecutedOn);
        dockerClient.listServicesCmd()
            .exec()
            .stream()
            .filter(this::isServiceDiscoverable)
            .forEach(this::refresh);
        eventsClosable = buildListener(listServicesExecutedOn);
    }

    private ResultCallback<Event> buildListener(final Instant since) {

        return dockerClient.eventsCmd2()
            .withEventTypeFilter(EventType2.SERVICE)
            .withSince(DateTimeFormatter.ISO_INSTANT.format(since))
            .withEventFilter(
                "create",
                "update",
                "remove"
            )
            .exec(new ResultCallbackTemplate<ResultCallback<Event>, Event>() {

                @Override
                public void onNext(final Event event) {
                    final String serviceID = event.getActor().getId();
                    if ("remove".equals(event.getAction())) {
                        removeService(serviceID);
                    } else {
                        final Service service = dockerClient.inspectServiceCmd(serviceID).exec();
                        if (isServiceDiscoverable(service)) {
                            refresh(service);
                        } else {
                            removeService(serviceID);
                        }
                    }
                }

                @Override
                public void onError(final Throwable e) {
                    if (e instanceof EOFException) {
                        refreshAllServices();
                    }
                }
            });
    }

    private void removeService(String serviceID) {
        services.remove(serviceID);
    }

    private void refresh(final Service service) {
        final Stream<? extends ServiceInstance> instances;
        if (service.getSpec().getEndpointSpec().getMode() == VIP) {
            instances = getServiceInstancesVip(service);
        } else if (service.getSpec().getEndpointSpec().getMode() == DNSRR) {
            instances = getServiceInstancesDnsRR(service);
        } else {
            throw new IllegalArgumentException(String.format("Unsupported mode %s", service.getSpec().getEndpointSpec().getMode()));
        }
        instances.forEach(
            serviceInstance -> {
                services.computeIfAbsent(serviceInstance.getServiceId(), k -> new ArrayList<>())
                    .add(serviceInstance);
            }
        );
    }

    /**
     * {@inheritDoc}
     *
     * @return {@code "Docker Swarm Discovery Client"}
     */
    @Override
    public String description() {
        return "Docker Swarm Discovery Client";
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

    /**
     * {@inheritDoc}
     */
    @Override
    public List<ServiceInstance> getInstances(final String serviceId) {
        if (!services.containsKey(serviceId)) {
            return Collections.emptyList();
        }
        return services.get(serviceId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<String> getServices() {

        return new ArrayList<>(services.keySet());
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

        final int servicePort = Integer.parseInt(dockerService.getSpec().getLabels().getOrDefault("spring.service.port", "8080"));
        final boolean serviceSecure = Boolean.parseBoolean(dockerService.getSpec().getLabels().getOrDefault("spring.service.secure", "false"));

        return Arrays.stream(dockerService.getEndpoint().getVirtualIPs())
            .filter(endpointVirtualIP -> networkIDsToScan.contains(endpointVirtualIP.getNetworkID()))
            .map(endpointVirtualIP -> endpointVirtualIP.getAddr().split("/")[0])
            .map(ipAddress -> new DefaultServiceInstance(
                dockerService.getId() + "_" + ipAddress,
                dockerService.getId(),
                ipAddress,
                servicePort,
                serviceSecure,
                dockerService.getSpec().getLabels()));
    }

    private Stream<? extends ServiceInstance> getServiceInstancesDnsRR(final Service dockerService) {

        final int servicePort = Integer.parseInt(dockerService.getSpec().getLabels().getOrDefault("spring.service.port", "8080"));
        final boolean serviceSecure = Boolean.parseBoolean(dockerService.getSpec().getLabels().getOrDefault("spring.service.secure", "false"));
        final List<NetworkAttachmentConfig> taskNetworks = dockerService.getSpec().getTaskTemplate().getNetworks();

        return taskNetworks
            .parallelStream()
            .filter(n -> networkIDsToScan.contains(n.getTarget()))
            .map(NetworkAttachmentConfig::getAliases)
            .flatMap(Collection::stream)
            .distinct()
            .flatMap(networkAlias -> {
                try {
                    final InetAddress[] ipAddresses = InetAddress.getAllByName(networkAlias);
                    return Arrays.stream(ipAddresses);
                } catch (UnknownHostException e1) {
                    return Stream.empty();
                }
            })
            .map(ipAddress -> new DefaultServiceInstance(
                dockerService.getId() + "_" + ipAddress.getHostAddress(),
                dockerService.getId(),
                ipAddress.getHostAddress(),
                servicePort,
                serviceSecure,
                dockerService.getSpec().getLabels()));

    }

    private boolean isNetworkConsidered(Service s) {
        final Set<String> networksForService = s.getSpec()
            .getNetworks()
            .stream()
            .map(NetworkAttachmentConfig::getTarget)
            .collect(Collectors.toSet());
        networksForService.retainAll(networkIDsToScan);
        return !networksForService.isEmpty();
    }
}
