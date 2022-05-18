package net.trajano.swarm.gateway.auth.simple;

import net.trajano.swarm.gateway.auth.oidc.ReactiveOidcService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "simple-auth.enabled", havingValue = "true")
public class SimpleAuthServiceConfiguration {

  @Bean
  <P> SimpleIdentityService<P> simpleAuthService(
      final ReactiveOidcService reactiveOidcService,
      final SimpleAuthServiceProperties simpleAuthServiceProperties) {

    return new SimpleIdentityService<>(reactiveOidcService);
  }
}
