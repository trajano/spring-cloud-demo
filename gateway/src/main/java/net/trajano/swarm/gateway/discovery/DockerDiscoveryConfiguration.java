package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class DockerDiscoveryConfiguration {

  @Bean
  DockerServiceInstanceProvider dockerServiceInstanceProvider(
      DockerClient dockerClient, DockerDiscoveryConfig config) {

    return new DockerServiceInstanceProvider(dockerClient, config);
  }

  @Bean
  DockerReactiveDiscoveryClient dockerReactiveDiscoveryClient(
      DockerServiceInstanceProvider dockerServiceInstanceProvider) {

    return new DockerReactiveDiscoveryClient(dockerServiceInstanceProvider);
  }

  //  @Bean
  //  DockerEventWatcher dockerEventWatcher(
  //      DockerEventWatcherEventCallback dockerEventWatcherEventCallback,
  //      DockerClient dockerClient,
  //      DockerDiscoveryConfig dockerDiscoveryConfig) {
  //    return new DockerEventWatcher(
  //        dockerEventWatcherEventCallback, dockerClient, dockerDiscoveryConfig);
  //  }

  @Bean
  DockerEventWatcherEventCallback dockerEventWatcherEventCallback(
      ApplicationEventPublisher publisher,
      DockerServiceInstanceProvider dockerServiceInstanceProvider,
      DockerClient dockerClient) {
    return new DockerEventWatcherEventCallback(
        publisher, dockerServiceInstanceProvider, dockerClient);
  }
}
