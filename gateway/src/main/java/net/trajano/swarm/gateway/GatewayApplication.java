package net.trajano.swarm.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.actuate.redis.RedisHealthIndicator;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration;
import org.springframework.cloud.client.discovery.simple.reactive.SimpleReactiveDiscoveryClientAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import reactor.core.scheduler.Schedulers;

/**
 * <a href="https://www.baeldung.com/spring-data-disable-auto-config>Exclusions</a> are done to
 * remove the simple {@link org.springframework.cloud.client.discovery.DiscoveryClient} which are
 * not used.
 */
@SpringBootApplication(
    exclude = {
      SimpleDiscoveryClientAutoConfiguration.class,
      SimpleReactiveDiscoveryClientAutoConfiguration.class
    })
public class GatewayApplication {

  public static void main(String[] args) {

    Schedulers.enableMetrics();
    //    BlockHound.install();
    SpringApplication.run(GatewayApplication.class, args);
  }

  @Bean
  RedisHealthIndicator redisHealthIndicator(RedisConnectionFactory redisConnectionFactory) {

    return new RedisHealthIndicator(redisConnectionFactory);
  }
}
