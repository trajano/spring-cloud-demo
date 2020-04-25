package net.trajano.spring.swarm.discovery;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.client.ReactiveCommonsClientAutoConfiguration;
import org.springframework.cloud.config.client.ConfigServicePropertySourceLocator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@ConditionalOnClass(ConfigServicePropertySourceLocator.class)
@ConditionalOnProperty("spring.cloud.config.discovery.enabled")
@Configuration(proxyBeanMethods = false)
@Import({
    DockerSwarmDiscoveryClientAutoConfiguration.class,
    // this emulates
    // @EnableDiscoveryClient, the import
    // selector doesn't run before the
    // bootstrap phase
    DockerClientConfiguration.class,
    DockerSwarmDiscoveryAutoConfiguration.class,
    DockerSwarmReactiveDiscoveryClientAutoConfiguration.class,
    ReactiveCommonsClientAutoConfiguration.class
})
public class DockerSwarmDiscoveryClientConfigServiceBootstrapConfiguration {
    @Bean
    public StackWalker log() {
        System.out.println("DockerSwarmDiscoveryClientConfigServiceBootstrapConfiguration");
        return StackWalker.getInstance();
    }
}
