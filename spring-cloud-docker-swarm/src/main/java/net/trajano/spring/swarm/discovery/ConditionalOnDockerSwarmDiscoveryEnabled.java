package net.trajano.spring.swarm.discovery;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@EnableConfigurationProperties
@ConditionalOnProperty(value = "docker.swarm.discovery.enabled", matchIfMissing = true)
public @interface ConditionalOnDockerSwarmDiscoveryEnabled {
}
