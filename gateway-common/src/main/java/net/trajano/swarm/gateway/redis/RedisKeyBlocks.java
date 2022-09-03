package net.trajano.swarm.gateway.redis;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisKeyBlocks {

  private static final String SIGNING_KEYS_FORMAT = "%s:signing-keys:%d";

  private static final String REFRESH_TOKEN_KEY_FORMAT = "%s:::refresh-token:::%s";
  public static final String ACCESS_TOKEN_JTI_DATA_KEY_FORMAT = "%s:::access-token-jti:::%s";

  private final AuthProperties authProperties;

  public static long computeBlock(long current, long blockSize, int offset) {

    return (current / blockSize + offset) * blockSize;
  }

  public String currentSigningRedisKey() {

    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), 0).getEpochSecond());
  }

  public String forRefreshToken(String refreshToken) {

    return REFRESH_TOKEN_KEY_FORMAT.formatted(authProperties.getRedisPrefix(), refreshToken);
  }

  public String nextSigningRedisKey() {

    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), 1).getEpochSecond());
  }

  public Instant nextTimeBlockForSigningKeys() {

    return startingInstantForSigningKeyTimeBlock(Instant.now(), 1);
  }

  public Instant nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration(
      int accessTokenExpirationInSeconds) {

    var v1 = startingInstantForSigningKeyTimeBlock(Instant.now(), 1);
    var v2 = Instant.now().plusSeconds(accessTokenExpirationInSeconds);
    return Instant.ofEpochSecond(Math.max(v1.getEpochSecond(), v2.getEpochSecond()));
  }

  public String previousSigningRedisKey() {

    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), -1).getEpochSecond());
  }

  public Instant startingInstantForSigningKeyTimeBlock(Instant now, int offset) {

    return Instant.ofEpochSecond(
        computeBlock(
            now.getEpochSecond(), authProperties.getSigningKeyBlockSizeInSeconds(), offset));
  }

  public String accessTokenJtiKey(String jwtId) {
    return ACCESS_TOKEN_JTI_DATA_KEY_FORMAT.formatted(authProperties.getRedisPrefix(), jwtId);
  }
}
