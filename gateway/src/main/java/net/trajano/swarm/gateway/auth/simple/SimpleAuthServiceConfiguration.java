package net.trajano.swarm.gateway.auth.simple;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SimpleAuthServiceConfiguration {

  @Bean
  @ConditionalOnMissingBean
  SimpleAuthService simpleAuthService(SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new SimpleAuthService<>(simpleAuthServiceProperties);
  }
}
