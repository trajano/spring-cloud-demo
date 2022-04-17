package net.trajano.swarm.gateway.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class DockerClientProvider {

    @Bean
    DockerClientConfig dockerClientConfig() {

        return DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost("unix:///var/run/docker.sock")
                .build();
    }

    @Bean
    DockerHttpClient dockerHttpClient(final DockerClientConfig dockerClientConfig) {

        return new ApacheDockerHttpClient.Builder()
                .dockerHost(dockerClientConfig.getDockerHost())
                .sslConfig(dockerClientConfig.getSSLConfig())
                .maxConnections(100)
                .connectionTimeout(Duration.ofSeconds(30))
                .responseTimeout(Duration.ofSeconds(45))
                .build();
    }

    @Bean
    DockerClient dockerClient(final DockerClientConfig dockerClientConfig, DockerHttpClient dockerHttpClient) {

        return DockerClientImpl.getInstance(dockerClientConfig, dockerHttpClient);

    }

}
