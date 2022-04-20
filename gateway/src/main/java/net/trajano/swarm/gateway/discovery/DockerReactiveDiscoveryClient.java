package net.trajano.swarm.gateway.discovery;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import reactor.core.publisher.Flux;

@Slf4j
@RequiredArgsConstructor
public class DockerReactiveDiscoveryClient implements ReactiveDiscoveryClient {

  private final DockerServiceInstanceLister dockerServiceInstanceLister;

  /**
   * Description that appears in the actuator/health page
   *
   * @return description.
   */
  @Override
  public String description() {

    return "Docker Reactive Discovery Client";
  }

  /** Does a probe by pinging the daemon. */
  @Override
  public void probe() {

    dockerServiceInstanceLister.probe();
  }

  @Override
  public Flux<ServiceInstance> getInstances(final String serviceId) {

    if (serviceId == null) {
      return Flux.empty();
    }
    final var instances = dockerServiceInstanceLister.getInstances(serviceId);
    log.debug("instances: {}", instances);
    return Flux.fromIterable(instances);
  }

  @Override
  public Flux<String> getServices() {

    final var services = dockerServiceInstanceLister.getServices();
    log.debug("services: {}", services);
    return Flux.fromIterable(services);
  }
}
