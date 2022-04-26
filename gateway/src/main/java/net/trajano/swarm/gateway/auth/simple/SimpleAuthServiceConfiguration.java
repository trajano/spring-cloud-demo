package net.trajano.swarm.gateway.auth.simple;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;

@Configuration
public class SimpleAuthServiceConfiguration {

    @Bean
    @ConditionalOnProperty(name="simple-auth.enabled", havingValue = "true")
    <P> SimpleAuthService<P> simpleAuthService(ReactiveStringRedisTemplate reactiveRedisTemplate, SimpleAuthServiceProperties simpleAuthServiceProperties) {

        return new SimpleAuthService<P>(simpleAuthServiceProperties, new RedisAuthCache(reactiveRedisTemplate, simpleAuthServiceProperties));

    }

}
