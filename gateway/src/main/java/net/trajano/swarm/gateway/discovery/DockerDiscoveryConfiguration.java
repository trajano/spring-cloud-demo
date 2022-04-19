package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import net.trajano.swarm.gateway.loadbalancer.DockerServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
// @LoadBalancerClients
public class DockerDiscoveryConfiguration {

  @Bean
  DockerServiceInstanceLister dockerServiceInstanceProvider(
      DockerClient dockerClient, DockerDiscoveryConfig config) {

    return new DockerServiceInstanceLister(dockerClient, config);
  }

  @Bean
  DockerReactiveDiscoveryClient dockerReactiveDiscoveryClient(
      DockerServiceInstanceLister dockerServiceInstanceLister) {

    return new DockerReactiveDiscoveryClient(dockerServiceInstanceLister);
  }

  //  @Bean
  //  DockerEventWatcher dockerEventWatcher(
  //      DockerEventWatcherEventCallback dockerEventWatcherEventCallback,
  //      DockerClient dockerClient,
  //      DockerDiscoveryConfig dockerDiscoveryConfig) {
  //    return new DockerEventWatcher(
  //        dockerEventWatcherEventCallback, dockerClient, dockerDiscoveryConfig);
  //  }
  //  @Bean
  //  @ConditionalOnMissingBean
  //  public ReactorLoadBalancer<ServiceInstance> reactorServiceInstanceLoadBalancer(
  //      Environment environment, LoadBalancerClientFactory loadBalancerClientFactory) {
  //    String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
  //    return new RoundRobinLoadBalancer(
  //        loadBalancerClientFactory.getLazyProvider(name, ServiceInstanceListSupplier.class),
  // name);
  //  }

  //  @Bean
  ServiceInstanceListSupplier discoveryClientServiceInstanceListSupplier(
      ConfigurableApplicationContext context,
      DockerServiceInstanceLister dockerServiceInstanceLister) {

    return new DockerServiceInstanceListSupplier(
        context.getEnvironment(), dockerServiceInstanceLister);
    //    final var build =
    // ServiceInstanceListSupplier.builder().withDiscoveryClient().build(context);
    //    System.out.println(build.getServiceId());
    //    return build;
  }

  @Bean
  DockerEventWatcherEventCallback dockerEventWatcherEventCallback(
      ApplicationEventPublisher publisher,
      DockerServiceInstanceLister dockerServiceInstanceLister,
      DockerClient dockerClient) {
    return new DockerEventWatcherEventCallback(
        publisher, dockerServiceInstanceLister, dockerClient);
  }
}
