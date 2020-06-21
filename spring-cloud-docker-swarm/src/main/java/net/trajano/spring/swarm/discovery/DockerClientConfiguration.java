package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.okhttp.OkDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DockerClientConfiguration {

    @Bean
    public DockerClient dockerClient(final DockerSwarmDiscoveryProperties properties) {

        final DockerClientConfig standard = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        final DockerHttpClient httpClient = new OkDockerHttpClient.Builder()
            .dockerHost(properties.getDaemonUri())
            .build();
        return DockerClientImpl.getInstance(standard, httpClient);
    }

}
