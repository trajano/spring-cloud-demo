package net.trajano.swarm.gateway.auth.simple;

import java.time.Instant;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class RedisKeyBlocks {

  /** Points to the refresh token data. */
  public static final String REFRESH_TOKEN_DATA_KEY_FORMAT = "%s:::refresh-token:::%s";
  /** Points to the refresh token data. */
  public static final String ACCESS_TOKEN_JTI_DATA_KEY_FORMAT = "%s:::access-token-jti:::%s";

  private final SimpleAuthServiceProperties simpleAuthServiceProperties;
  private static final String SIGNING_KEYS_FORMAT = "%s:::signing-keys:::%d";

  public String accessTokenJtiKey(String jwtId) {
    return ACCESS_TOKEN_JTI_DATA_KEY_FORMAT.formatted(
        simpleAuthServiceProperties.getRedisPrefix(), jwtId);
  }

  public Instant nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration() {
    var v1 = timeBlockForSigningKeys(Instant.now(), 1);
    var v2 =
        Instant.now().plusSeconds(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds());
    return Instant.ofEpochSecond(Math.max(v1.getEpochSecond(), v2.getEpochSecond()));
  }

  public Instant timeBlockForSigningKeys(Instant now, int offset) {

    return Instant.ofEpochSecond(
        computeBlock(
            now.getEpochSecond(),
            simpleAuthServiceProperties.getSigningKeyExpiresInSeconds(),
            offset));
  }

  public Instant nextTimeBlockForSigningKeys() {
    return timeBlockForSigningKeys(Instant.now(), 1);
  }

  public static long computeBlock(long current, long blockSize, int offset) {

    return (current / blockSize + offset) * blockSize;
  }

  public String currentSigningRedisKey() {
    return SIGNING_KEYS_FORMAT.formatted(
        simpleAuthServiceProperties.getRedisPrefix(),
        timeBlockForSigningKeys(Instant.now(), 0).getEpochSecond());
  }

  public String previousSigningRedisKey() {
    return SIGNING_KEYS_FORMAT.formatted(
        simpleAuthServiceProperties.getRedisPrefix(),
        timeBlockForSigningKeys(Instant.now(), -1).getEpochSecond());
  }

  public String refreshTokenKey(String refreshToken) {

    return REFRESH_TOKEN_DATA_KEY_FORMAT.formatted(
        simpleAuthServiceProperties.getRedisPrefix(), refreshToken);
  }
}
