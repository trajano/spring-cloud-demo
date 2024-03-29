package net.trajano.swarm.gateway.discovery;

import net.trajano.swarm.gateway.docker.ReactiveDockerClient;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.ConditionalOnDiscoveryEnabled;
import org.springframework.cloud.client.ConditionalOnReactiveDiscoveryEnabled;
import org.springframework.cloud.client.ReactiveCommonsClientAutoConfiguration;
import org.springframework.cloud.client.discovery.health.DiscoveryClientHealthIndicatorProperties;
import org.springframework.cloud.client.discovery.health.reactive.ReactiveDiscoveryClientHealthIndicator;
import org.springframework.cloud.client.discovery.health.reactive.ReactiveDiscoveryHealthIndicator;
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClientConfiguration;
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClients;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnReactiveDiscoveryEnabled
@EnableConfigurationProperties
@AutoConfigureBefore(ReactiveCommonsClientAutoConfiguration.class)
@LoadBalancerClients(defaultConfiguration = LoadBalancerClientConfiguration.class)
public class DockerDiscoveryConfiguration {

  @Bean
  //  @Lazy
  DockerServiceInstanceLister dockerServiceInstanceLister(
      ApplicationEventPublisher publisher,
      DockerServiceInstanceBuilder dockerServiceInstanceBuilder,
      ReactiveDockerClient dockerClient,
      DockerDiscoveryProperties config) {

    return new DockerServiceInstanceLister(
        publisher, dockerServiceInstanceBuilder, dockerClient, config);
  }

  @Bean
  DockerReactiveDiscoveryClient dockerReactiveDiscoveryClient(
      DockerServiceInstanceLister dockerServiceInstanceLister) {

    return new DockerReactiveDiscoveryClient(dockerServiceInstanceLister);
  }

  @Bean
  ReactiveDiscoveryHealthIndicator dockerReactiveDiscoveryHealthIndicator(
      DockerReactiveDiscoveryClient dockerReactiveDiscoveryClient,
      DiscoveryClientHealthIndicatorProperties discoveryClientHealthIndicatorProperties) {

    return new ReactiveDiscoveryClientHealthIndicator(
        dockerReactiveDiscoveryClient, discoveryClientHealthIndicatorProperties);
  }
}
