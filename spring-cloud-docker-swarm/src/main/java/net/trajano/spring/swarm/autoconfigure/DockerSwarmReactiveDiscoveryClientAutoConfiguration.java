package net.trajano.spring.swarm.autoconfigure;

import lombok.extern.slf4j.Slf4j;
import net.trajano.spring.swarm.autoconfigure.DockerSwarmDiscoveryAutoConfiguration;
import net.trajano.spring.swarm.discovery.ConditionalOnDockerSwarmDiscoveryEnabled;
import net.trajano.spring.swarm.discovery.DockerSwarmDiscovery;
import net.trajano.spring.swarm.discovery.DockerSwarmReactiveDiscoveryClient;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.client.ConditionalOnDiscoveryEnabled;
import org.springframework.cloud.client.ConditionalOnReactiveDiscoveryEnabled;
import org.springframework.cloud.client.ReactiveCommonsClientAutoConfiguration;
import org.springframework.cloud.client.discovery.composite.reactive.ReactiveCompositeDiscoveryClientAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnReactiveDiscoveryEnabled
@ConditionalOnDockerSwarmDiscoveryEnabled
@AutoConfigureAfter({
    DockerSwarmDiscoveryAutoConfiguration.class,
    ReactiveCompositeDiscoveryClientAutoConfiguration.class
})
@AutoConfigureBefore({
    ReactiveCommonsClientAutoConfiguration.class
})
@Slf4j
public class DockerSwarmReactiveDiscoveryClientAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmReactiveDiscoveryClient dockerSwarmReactiveDiscoveryClient(final DockerSwarmDiscovery dockerSwarmDiscovery) {
        return new DockerSwarmReactiveDiscoveryClient(dockerSwarmDiscovery);
    }
}
