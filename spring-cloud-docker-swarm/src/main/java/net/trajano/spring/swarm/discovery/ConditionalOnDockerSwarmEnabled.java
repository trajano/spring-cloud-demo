package net.trajano.spring.swarm.discovery;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@ConditionalOnProperty(value = "spring.cloud.dockerswarm.discovery.enabled", matchIfMissing = true)
public @interface ConditionalOnDockerSwarmEnabled {
}
