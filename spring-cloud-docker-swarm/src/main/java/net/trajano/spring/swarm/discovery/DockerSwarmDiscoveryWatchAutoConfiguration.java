package net.trajano.spring.swarm.discovery;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Configuration;

/**
 * This replaces the {@link ApplicationEventPublisher} on the {@link DockerSwarmDiscovery} with the one provided in the
 * current {@link org.springframework.context.ApplicationContext}.  This is needed as during bootstrap the
 * {@link org.springframework.context.ApplicationContext} is not the same and
 * {@link ApplicationEventPublisher#publishEvent(ApplicationEvent)} would not have its events processed.
 */
@Configuration
@ConditionalOnBean(DockerSwarmDiscovery.class)
@Slf4j
public class DockerSwarmDiscoveryWatchAutoConfiguration implements InitializingBean {

    @Autowired
    private DockerSwarmDiscovery dockerSwarmDiscovery;

    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;

    @Override
    public void afterPropertiesSet() throws Exception {
        dockerSwarmDiscovery.setApplicationEventPublisher(applicationEventPublisher);
    }

}
