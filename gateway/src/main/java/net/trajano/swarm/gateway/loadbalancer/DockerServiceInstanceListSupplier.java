package net.trajano.swarm.gateway.loadbalancer;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.discovery.DockerServiceInstanceProvider;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
public class DockerServiceInstanceListSupplier implements ServiceInstanceListSupplier {

  private final Environment environment;

  private final DockerServiceInstanceProvider serviceInstanceProvider;

  public DockerServiceInstanceListSupplier(
      Environment environment, DockerServiceInstanceProvider serviceInstanceProvider) {

    this.environment = environment;
    this.serviceInstanceProvider = serviceInstanceProvider;
  }

  public Flux<List<ServiceInstance>> get() {

    return Flux.just(
        serviceInstanceProvider.getServices().stream()
            .flatMap(s -> serviceInstanceProvider.getInstances(s).stream())
            .toList());
  }

  @Override
  public String getServiceId() {

    return environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
  }
}
