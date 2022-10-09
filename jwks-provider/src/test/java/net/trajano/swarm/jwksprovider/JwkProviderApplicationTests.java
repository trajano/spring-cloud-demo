package net.trajano.swarm.jwksprovider;

import static org.assertj.core.api.Assertions.assertThat;

import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.redis.JwksRedisPopulator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.test.context.ContextConfiguration;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@ContextConfiguration(
    classes = {
      AuthProperties.class,
      RedisKeyBlocks.class,
      JwkProviderApplication.class,
      JwksRedisPopulator.class,
      JwkProviderApplicationTests.TestConfig.class
    })
@Testcontainers
class JwkProviderApplicationTests {

  @Container
  private static GenericContainer<?> redis =
      new GenericContainer<>("redis:6")
          .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*", 1))
          .withExposedPorts(6379);

  @Autowired private JwksRedisPopulator jwksPopulator;

  @Test
  void contextLoads() {
    assertThat(jwksPopulator).isNotNull();
  }

  static class TestConfig {
    @Bean
    @Primary
    RedisConnectionFactory redisConnectionFactory() {
      return new LettuceConnectionFactory(redis.getHost(), redis.getMappedPort(6379));
    }
  }
}
