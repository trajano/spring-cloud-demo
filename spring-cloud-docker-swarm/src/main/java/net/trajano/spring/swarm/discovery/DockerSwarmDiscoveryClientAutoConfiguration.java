package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.client.CommonsClientAutoConfiguration;
import org.springframework.cloud.client.ConditionalOnBlockingDiscoveryEnabled;
import org.springframework.cloud.client.ConditionalOnDiscoveryEnabled;
import org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration;
import org.springframework.cloud.config.client.ConfigServiceBootstrapConfiguration;
import org.springframework.cloud.config.client.DiscoveryClientConfigServiceBootstrapConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnBlockingDiscoveryEnabled
@ConditionalOnDockerSwarmDiscoveryEnabled
@AutoConfigureAfter({
    DockerSwarmDiscoveryAutoConfiguration.class
})
@AutoConfigureBefore({
    SimpleDiscoveryClientAutoConfiguration.class,
    CommonsClientAutoConfiguration.class
})
@Slf4j
public class DockerSwarmDiscoveryClientAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscoveryClient dockerSwarmDiscoveryClient(final DockerSwarmDiscovery dockerSwarmDiscovery) {
        return new DockerSwarmDiscoveryClient(dockerSwarmDiscovery);
    }

}
