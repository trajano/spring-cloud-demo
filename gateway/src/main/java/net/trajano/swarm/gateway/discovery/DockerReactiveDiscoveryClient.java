package net.trajano.swarm.gateway.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import reactor.core.publisher.Flux;

@Slf4j
public class DockerReactiveDiscoveryClient implements ReactiveDiscoveryClient {

  private final DockerServiceInstanceProvider dockerServiceInstanceProvider;

  public DockerReactiveDiscoveryClient(
      DockerServiceInstanceProvider dockerServiceInstanceProvider) {

    this.dockerServiceInstanceProvider = dockerServiceInstanceProvider;
  }

  @Override
  public String description() {

    return "DockerReactiveDiscoveryClient";
  }

  @Override
  public Flux<ServiceInstance> getInstances(final String serviceId) {

    if (serviceId == null) {
      return Flux.empty();
    }
    final var instances = dockerServiceInstanceProvider.getInstances(serviceId);
    return Flux.fromIterable(instances);
  }

  @Override
  public Flux<String> getServices() {

    final var services = dockerServiceInstanceProvider.getServices();
    log.info("services: {}", services);
    return Flux.fromIterable(services);
  }
}
