package net.trajano.swarm.jwksprovider;

import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.dao.JsonWebKeyPairs;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackageClasses = {JwkProviderApplication.class, AuthProperties.class})
@EnableScheduling
@EnableR2dbcRepositories(basePackageClasses = JsonWebKeyPairs.class)
public class JwkProviderApplication {

  public static void main(String[] args) {
    SpringApplication.run(JwkProviderApplication.class, args);
  }
}
