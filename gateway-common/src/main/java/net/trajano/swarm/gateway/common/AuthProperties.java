package net.trajano.swarm.gateway.common;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")
@Data
public class AuthProperties {
  private String realm = "JWT";

  /** Prefix for keys. */
  private String redisPrefix = "gateway";
  /** Maximum expected size of JWT when decompressed. Defaults to 4096 bytes. */
  private int jwtSizeLimitInBytes = 4096;

  private String issuer = "http://localhost";
  private int signingKeysPerBlock = 3;

  /** Access token time expires in seconds. This is kept low to make it easier to test. */
  private int accessTokenExpiresInSeconds = 120;

  /** Refresh token time expires in seconds. This is kept low to make it easier to test. */
  private int refreshTokenExpiresInSeconds = 1200;

  private int maximumNumberOfSigningKeysToPresent = 3;

  /** If true, the JWT is compressed when placed in the access token. */
  private boolean compressClaims = true;

  private int maximumNumberOfSigningKeys = 10;
  /**
   * Signing key time expires in seconds and must be larger than {@link
   * #accessTokenExpiresInSeconds} and must be at least 2 times larger than {@link
   * #signingKeyBlockSizeInSeconds}. This is kept low to make it easier to test.
   */
  private int signingKeyExpiresInSeconds = 240 * 2;

  /**
   * Signing block size in seconds and must be larger than {@link #accessTokenExpiresInSeconds}.
   * This is kept low to make it easier to test.
   */
  private int signingKeyBlockSizeInSeconds = 240;

  private int penaltyDelayInMillis = 1000;
}
