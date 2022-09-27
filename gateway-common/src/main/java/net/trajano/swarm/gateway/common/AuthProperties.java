package net.trajano.swarm.gateway.common;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")
@Data
public class AuthProperties {

  /** Access token time expires in seconds. This is kept low to make it easier to test. */
  private int accessTokenExpiresInSeconds = 120;

  private int allowedClockSkewInSeconds = 0;

  /** Number of milliseconds an authentication should be allowed take. */
  private int authenticationProcessingTimeoutInMillis = 4000;

  /** If true, the JWT is compressed when placed in the access token. */
  private boolean compressClaims = true;

  private DataSource dataSource = DataSource.REDIS;

  private String issuer = "http://localhost";

  /** Maximum expected size of JWT when decompressed. Defaults to 4096 bytes. */
  private int jwtSizeLimitInBytes = 4096;

  private int maximumNumberOfSigningKeys = 10;

  private int maximumNumberOfSigningKeysToPresent = 3;

  /**
   * Minimum age for the access token before it needs to be refreshed. If the age is less than the
   * amount, it will not perform the sign.
   */
  private long minimumAccessTokenAgeBeforeRefreshInMillis = 30 * 1000L;

  /**
   * Specifies the minimum time for an auth operation must have. This reduces the load on the system
   * as it defers the response so it can deflect the load on the system.
   */
  private long minimumOperationTimeInMillis = 200L;

  private int penaltyDelayInMillis = 1000;

  private String realm = "JWT";

  /** Prefix for keys. */
  private String redisPrefix = "gateway";

  /** Number of milliseconds a refresh should be allowed take. */
  private int refreshProcessingTimeoutInMillis = 3000;

  /** Refresh token time expires in seconds. This is kept low to make it easier to test. */
  private int refreshTokenExpiresInSeconds = 1200;

  /** Number of milliseconds a revoke should be allowed take. */
  private int revokeProcessingTimeoutInMillis = 3000;

  /**
   * Signing block size in seconds and must be larger than {@link #accessTokenExpiresInSeconds}.
   * This is kept low to make it easier to test.
   */
  private int signingKeyBlockSizeInSeconds = 240;

  /**
   * Signing key time expires in seconds and must be larger than {@link
   * #accessTokenExpiresInSeconds} and must be at least 2 times larger than {@link
   * #signingKeyBlockSizeInSeconds}. This is kept low to make it easier to test.
   */
  private int signingKeyExpiresInSeconds = 240 * 2;

  private int signingKeysPerBlock = 3;

  /**
   * If disabled, {@link java.util.concurrent.ThreadLocalRandom} would be used to generate the UUIDs
   * which is more performant, but may cause delays when there isn't enough entropy generated.
   */
  private boolean useSecureRandom = true;

  public enum DataSource {
    REDIS,
    DATABASE
  }
}
