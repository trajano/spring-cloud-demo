package net.trajano.swarm.gateway.common;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")
@Data
public class AuthProperties {
  private String realm = "JWT";
  private int penaltyDelayInMillis = 1000;
  /** Prefix for keys. */
  private String redisPrefix = "gateway";
  /** Maximum expected size of JWT when decompressed. Defaults to 4096 bytes. */
  private int jwtSizeLimitInBytes = 4096;

  private int signingKeyExpiresInSeconds = 240;
  private int signingKeysPerBlock = 3;
}
