package net.trajano.swarm.gateway.auth.simple;

import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;

@Configuration
@ConditionalOnProperty(name = "simple-auth.enabled", havingValue = "true")
public class SimpleAuthServiceConfiguration {

  @Bean
  RedisAuthCache redisAuthCache(
      final ReactiveStringRedisTemplate reactiveRedisTemplate,
      final SimpleAuthRedisKeyBlocks redisKeyBlocks,
      final JwksProvider jwksProvider,
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new RedisAuthCache(
        reactiveRedisTemplate, redisKeyBlocks, simpleAuthServiceProperties, jwksProvider);
  }

  @Bean
  SimpleAuthRedisKeyBlocks simpleAuthRedisKeyBlocks(
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new SimpleAuthRedisKeyBlocks(simpleAuthServiceProperties);
  }

  @Bean
  <P> SimpleIdentityService<P> simpleAuthService(
      final RedisAuthCache redisAuthCache,
      final JwksProvider jwksProvider,
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new SimpleIdentityService<>(simpleAuthServiceProperties, jwksProvider, redisAuthCache);
  }
}
