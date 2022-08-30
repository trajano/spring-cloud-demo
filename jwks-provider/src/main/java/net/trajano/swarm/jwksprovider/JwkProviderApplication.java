package net.trajano.swarm.jwksprovider;

import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.dao.KeyPairs;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackageClasses = {JwkProviderApplication.class, AuthProperties.class})
@EnableScheduling
// @EnableJdbcRepositories(basePackageClasses = KeyPairs.class)
@EnableR2dbcRepositories(basePackageClasses = KeyPairs.class)
public class JwkProviderApplication {

  public static void main(String[] args) {
    SpringApplication.run(JwkProviderApplication.class, args);
  }
}
