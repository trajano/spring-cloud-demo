package net.trajano.swarm.jwksprovider;

import net.trajano.swarm.gateway.common.AuthProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.actuate.redis.RedisHealthIndicator;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackageClasses = {JwkProviderApplication.class, AuthProperties.class})
@EnableScheduling
public class JwkProviderApplication {

  public static void main(String[] args) {
    SpringApplication.run(JwkProviderApplication.class, args);
  }

  @Bean
  RedisHealthIndicator redisHealthIndicator(RedisConnectionFactory redisConnectionFactory) {
    return new RedisHealthIndicator(redisConnectionFactory);
  }
}
