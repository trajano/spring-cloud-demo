package net.trajano.spring.swarm.autoconfigure;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.client.ReactiveCommonsClientAutoConfiguration;
import org.springframework.cloud.config.client.ConfigServicePropertySourceLocator;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@ConditionalOnClass(ConfigServicePropertySourceLocator.class)
@ConditionalOnProperty("spring.cloud.config.discovery.enabled")
@Configuration(proxyBeanMethods = false)
@Import({
    // this emulates
    // @EnableDiscoveryClient, the import
    // selector doesn't run before the
    // bootstrap phase
    DockerSwarmDiscoveryAutoConfiguration.class,
    DockerSwarmReactiveDiscoveryClientAutoConfiguration.class,
    DockerSwarmDiscoveryClientAutoConfiguration.class,
    ReactiveCommonsClientAutoConfiguration.class
})
public class DockerSwarmDiscoveryClientConfigServiceBootstrapConfiguration {
}
