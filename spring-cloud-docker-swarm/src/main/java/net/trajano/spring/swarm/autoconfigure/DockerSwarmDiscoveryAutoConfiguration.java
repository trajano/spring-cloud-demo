package net.trajano.spring.swarm.autoconfigure;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.okhttp.OkDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import lombok.extern.slf4j.Slf4j;
import net.trajano.spring.swarm.discovery.ConditionalOnDockerSwarmDiscoveryEnabled;
import net.trajano.spring.swarm.discovery.DockerSwarmDiscovery;
import net.trajano.spring.swarm.discovery.DockerSwarmDiscoveryProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.ConditionalOnDiscoveryEnabled;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnDockerSwarmDiscoveryEnabled
@EnableConfigurationProperties
@Slf4j
public class DockerSwarmDiscoveryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscoveryProperties dockerSwarmDiscoveryProperties() {
        final DockerSwarmDiscoveryProperties dockerSwarmDiscoveryProperties = new DockerSwarmDiscoveryProperties();
        log.debug("dockerSwarmDiscoveryProperties={}", dockerSwarmDiscoveryProperties);
        return dockerSwarmDiscoveryProperties;
    }

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscovery dockerSwarmDiscovery(final DockerSwarmDiscoveryProperties properties, final ApplicationEventPublisher applicationEventPublisher) {

        final DockerSwarmDiscovery dockerSwarmDiscovery = new DockerSwarmDiscovery(properties);
        dockerSwarmDiscovery.setApplicationEventPublisher(applicationEventPublisher);
        log.debug("dockerSwarmDiscovery={}", dockerSwarmDiscovery);
        return dockerSwarmDiscovery;
    }

    @Bean
    @ConditionalOnMissingBean
    public DockerClient dockerClient(final DockerSwarmDiscoveryProperties properties) {

        final DockerClientConfig standard = DefaultDockerClientConfig.createDefaultConfigBuilder()
            .build();
        final DockerHttpClient httpClient = new OkDockerHttpClient.Builder()
            .dockerHost(properties.getDaemonUri())
            .build();
        return DockerClientImpl.getInstance(standard, httpClient);

    }

}
