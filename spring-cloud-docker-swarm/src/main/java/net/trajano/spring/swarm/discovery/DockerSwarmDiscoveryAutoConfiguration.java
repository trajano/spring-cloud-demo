package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.client.ConditionalOnDiscoveryEnabled;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnDockerSwarmDiscoveryEnabled
@Slf4j
public class DockerSwarmDiscoveryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscoveryProperties dockerSwarmDiscoveryProperties() {
        return new DockerSwarmDiscoveryProperties();
    }

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscovery dockerSwarmDiscovery(final DockerSwarmDiscoveryProperties properties) {
        return new DockerSwarmDiscovery(properties);
    }
}
