package net.trajano.swarm.jwksprovider;

import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackageClasses = {
      JwkProviderApplication.class,
      AuthProperties.class,
      RedisKeyBlocks.class
    })
@EnableScheduling
public class JwkProviderApplication {

  public static void main(String[] args) {
    SpringApplication.run(JwkProviderApplication.class, args);
  }
}
