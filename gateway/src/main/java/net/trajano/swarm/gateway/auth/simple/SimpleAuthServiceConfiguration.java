package net.trajano.swarm.gateway.auth.simple;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;

@Configuration
@ConditionalOnProperty(name = "simple-auth.enabled", havingValue = "true")
public class SimpleAuthServiceConfiguration {

  @Bean
  <P> SimpleIdentityService<P> simpleAuthService(
      final RedisAuthCache redisAuthCache,
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new SimpleIdentityService<>(simpleAuthServiceProperties, redisAuthCache);
  }

  @Bean
  RedisAuthCache redisAuthCache(
      final ReactiveStringRedisTemplate reactiveRedisTemplate,
      final RedisKeyBlocks redisKeyBlocks,
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new RedisAuthCache(reactiveRedisTemplate, redisKeyBlocks, simpleAuthServiceProperties);
  }

  @Bean
  RedisKeyBlocks redisKeyBlocks(final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new RedisKeyBlocks(simpleAuthServiceProperties);
  }
}
