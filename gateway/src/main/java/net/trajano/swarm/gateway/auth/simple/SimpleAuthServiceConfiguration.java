package net.trajano.swarm.gateway.auth.simple;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;

@Configuration
@ConditionalOnProperty(name="simple-auth.enabled", havingValue = "true")
public class SimpleAuthServiceConfiguration {

    @Bean
    <P> SimpleAuthService<P> simpleAuthService(final RedisAuthCache redisAuthCache, final SimpleAuthServiceProperties simpleAuthServiceProperties) {

        return new SimpleAuthService<P>(simpleAuthServiceProperties, redisAuthCache);

    }

    @Bean
    RedisAuthCache redisAuthCache(final ReactiveStringRedisTemplate reactiveRedisTemplate, final SimpleAuthServiceProperties simpleAuthServiceProperties) {

        return new RedisAuthCache(reactiveRedisTemplate, simpleAuthServiceProperties);

    }

}
