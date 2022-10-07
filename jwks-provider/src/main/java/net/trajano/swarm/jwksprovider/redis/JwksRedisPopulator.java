package net.trajano.swarm.jwksprovider.redis;

import java.time.Instant;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.JsonWebKeyPairProvider;
import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwksRedisPopulator {

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final StringRedisTemplate redisTemplate;

  private final JsonWebKeyPairProvider jsonWebKeyPairProvider;

  /**
   * Builds an entry that will expire
   *
   * @param key key
   * @param expiresAt expires at
   */
  private void buildEntryForBlock(String key, Instant expiresAt) {

    final var ops = redisTemplate.opsForSet();
    final var keyPairJwks =
        IntStream.range(0, authProperties.getSigningKeysPerBlock())
            .mapToObj(i -> jsonWebKeyPairProvider.nextJsonWebKeyPair())
            .map(JsonWebKeySet::toJson)
            .toArray(String[]::new);

    ops.add(key, keyPairJwks);
    redisTemplate.expireAt(key, expiresAt);
  }

  /**
   * Builds an entry that will expire for a given block
   *
   * @param startingInstantForSigningKeyTimeBlock starting instant
   */
  public void buildEntryIfItDoesNotExistForBlock(Instant startingInstantForSigningKeyTimeBlock) {

    final var key = redisKeyBlocks.forSigningRedisKey(startingInstantForSigningKeyTimeBlock);

    if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
      return;
    }

    // expire 3x the block size
    final var expiresAt =
        startingInstantForSigningKeyTimeBlock
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds());
    log.debug("populating redis key={} expiration={}", key, expiresAt);

    buildEntryForBlock(key, expiresAt);
  }
}
