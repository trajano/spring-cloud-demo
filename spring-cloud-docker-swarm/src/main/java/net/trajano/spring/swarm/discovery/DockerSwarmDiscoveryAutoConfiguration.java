package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.okhttp.OkHttpDockerCmdExecFactory;
import lombok.extern.slf4j.Slf4j;
import net.trajano.spring.swarm.client.DockerClient2;
import net.trajano.spring.swarm.client.DockerClientImpl2;
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
        return new DockerSwarmDiscoveryProperties();
    }

    @Bean
    @ConditionalOnMissingBean
    public DockerSwarmDiscovery dockerSwarmDiscovery(final DockerSwarmDiscoveryProperties properties, final ApplicationEventPublisher applicationEventPublisher) {

        final DockerSwarmDiscovery dockerSwarmDiscovery = new DockerSwarmDiscovery(properties);
        dockerSwarmDiscovery.setApplicationEventPublisher(applicationEventPublisher);
        return dockerSwarmDiscovery;
    }

    @Bean
    @ConditionalOnMissingBean
    public DockerClient2 dockerClient(final DockerSwarmDiscoveryProperties properties) {
        return DockerClientImpl2.getInstance(properties.getDaemonUri())
            .withDockerCmdExecFactory(
                new OkHttpDockerCmdExecFactory()
            );
    }

}
