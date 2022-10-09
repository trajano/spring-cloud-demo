package net.trajano.swarm.gateway.auth.clientmanagement;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClientManagementConfiguration {

  @Bean
  @ConditionalOnMissingBean
  ClientManagementService noCheckClientManagementService() {
    return new NoCheckClientManagementService();
  }
}
