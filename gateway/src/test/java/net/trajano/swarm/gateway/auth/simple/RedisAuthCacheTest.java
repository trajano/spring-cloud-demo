package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;

@SpringBootTest(
    classes = {
      RedisAuthCache.class,
      SimpleAuthServiceProperties.class,
      SimpleAuthRedisKeyBlocks.class,
      RedisAuthCacheTest.TestConfig.class
    })
class RedisAuthCacheTest {

  @TestConfiguration
  static class TestConfig {

    @Bean
    @Primary
    ReactiveStringRedisTemplate mockReactiveStringRedisTemplate() {

      final var reactiveStringRedisTemplate = mock(ReactiveStringRedisTemplate.class);
      when(reactiveStringRedisTemplate.hasKey(anyString())).thenReturn(Mono.just(false));
      return reactiveStringRedisTemplate;
    }
  }

  @Autowired RedisAuthCache redisAuthCache;

  @Test
  void contextLoads() {

    assertThat(redisAuthCache).isNotNull();
  }
}
