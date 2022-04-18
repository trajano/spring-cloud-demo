package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import net.trajano.swarm.gateway.loadbalancer.DockerServiceInstanceListSupplier;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.cloud.client.ReactiveCommonsClientAutoConfiguration;
import org.springframework.cloud.client.discovery.simple.reactive.SimpleReactiveDiscoveryClientAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@AutoConfigureBefore({
  SimpleReactiveDiscoveryClientAutoConfiguration.class,
  ReactiveCommonsClientAutoConfiguration.class
})
public class DockerDiscoveryConfiguration {

  @Bean
  DockerReactiveDiscoveryClient dockerReactiveDiscoveryClient(
      final DockerClient dockerClient, final DockerDiscoveryConfig config) {

    return new DockerReactiveDiscoveryClient(dockerClient, config);
  }

  @Bean
  DockerServiceInstanceListSupplier dockerServiceInstanceListSupplier(
      final DockerClient dockerClient, final DockerDiscoveryConfig config) {

    return new DockerServiceInstanceListSupplier(dockerClient, config);
  }
}
