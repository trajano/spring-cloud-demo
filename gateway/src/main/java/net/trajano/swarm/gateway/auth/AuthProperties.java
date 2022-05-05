package net.trajano.swarm.gateway.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")
@Data
public class AuthProperties {
  private String realm = "JWT";
  private int penaltyDelayInMillis = 1000;
}
