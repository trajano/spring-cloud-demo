package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import net.trajano.spring.swarm.client.DockerClient2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.client.CommonsClientAutoConfiguration;
import org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration;
import org.springframework.cloud.config.client.DiscoveryClientConfigServiceBootstrapConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

//@Configuration(proxyBeanMethods = false)
@Configuration
@ConditionalOnDockerSwarmEnabled
@AutoConfigureBefore({SimpleDiscoveryClientAutoConfiguration.class,
    DiscoveryClientConfigServiceBootstrapConfiguration.class,
    CommonsClientAutoConfiguration.class})
@AutoConfigureAfter({

})
@Slf4j
public class DockerSwarmDiscoveryClientAutoConfiguration {

    /**
     * Specifies a comma separated list of networks to look for services that contain the service labels.
     * If not specified it will use all the networks that the container has access to.
     */
    @Value("${docker.discovery.networks:#{null}}")
    private String dockerDiscoveryNetworks;

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscoveryClient dockerSwarmDiscoveryClient(DockerClient2 dockerClient, Environment environment) {
        log.warn("Building client");
        return new DockerSwarmDiscoveryClient(dockerClient, dockerDiscoveryNetworks, environment);
    }
}
