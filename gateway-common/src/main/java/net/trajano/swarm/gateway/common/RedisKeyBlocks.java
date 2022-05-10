package net.trajano.swarm.gateway.common;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisKeyBlocks {

  private final AuthProperties authProperties;
  private static final String SIGNING_KEYS_FORMAT = "%s:::signing-keys:::%d";

  public Instant nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration(
      int accessTokenExpirationInSeconds) {
    var v1 = startingInstantForSigningKeyTimeBlock(Instant.now(), 1);
    var v2 = Instant.now().plusSeconds(accessTokenExpirationInSeconds);
    return Instant.ofEpochSecond(Math.max(v1.getEpochSecond(), v2.getEpochSecond()));
  }

  public Instant startingInstantForSigningKeyTimeBlock(Instant now, int offset) {

    return Instant.ofEpochSecond(
        computeBlock(now.getEpochSecond(), authProperties.getSigningKeyExpiresInSeconds(), offset));
  }

  public Instant nextTimeBlockForSigningKeys() {
    return startingInstantForSigningKeyTimeBlock(Instant.now(), 1);
  }

  public static long computeBlock(long current, long blockSize, int offset) {

    return (current / blockSize + offset) * blockSize;
  }

  public String currentSigningRedisKey() {
    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), 0).getEpochSecond());
  }

  public String nextSigningRedisKey() {
    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), 1).getEpochSecond());
  }

  public String previousSigningRedisKey() {
    return SIGNING_KEYS_FORMAT.formatted(
        authProperties.getRedisPrefix(),
        startingInstantForSigningKeyTimeBlock(Instant.now(), -1).getEpochSecond());
  }
}
