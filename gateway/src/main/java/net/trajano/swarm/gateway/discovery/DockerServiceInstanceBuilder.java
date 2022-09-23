package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.model.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DockerServiceInstanceBuilder {

  private final DockerDiscoveryProperties dockerDiscoveryProperties;

  public ServiceInstance build(Service service, String serviceId, String address) {
    return new DockerServiceInstance(
        service, dockerDiscoveryProperties.getLabelPrefix(), serviceId, address);
  }
}
