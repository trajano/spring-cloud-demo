package net.trajano.swarm.gateway.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@RequiredArgsConstructor
public class DockerClientProvider {

  private final DockerProperties dockerProperties;

  @Bean(destroyMethod = "close")
  DockerClient dockerClient(
      final DockerClientConfig dockerClientConfig, DockerHttpClient dockerHttpClient) {

    return DockerClientImpl.getInstance(dockerClientConfig, dockerHttpClient);
  }

  @Bean
  DockerClientConfig dockerClientConfig() {

    return DefaultDockerClientConfig.createDefaultConfigBuilder()
        .withDockerHost(dockerProperties.getHost())
        .build();
  }

  @Bean(destroyMethod = "close")
  DockerHttpClient dockerHttpClient(final DockerClientConfig dockerClientConfig) {

    return new ApacheDockerHttpClient.Builder()
        .dockerHost(dockerClientConfig.getDockerHost())
        .sslConfig(dockerClientConfig.getSSLConfig())
        .maxConnections(100)
        .connectionTimeout(Duration.ofSeconds(30))
        .responseTimeout(Duration.ofSeconds(45))
        .build();
  }
}
