package net.trajano.swarm.jwksprovider.redis;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.JsonWebKeyPairProvider;
import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwksRedisPopulator {

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  private final JsonWebKeyPairProvider jsonWebKeyPairProvider;

  /**
   * Builds an entry that will expire
   *
   * @param key key
   * @param expiresAt expires at
   * @return Boolean mono if the expiration was set up correctly
   */
  private Mono<Boolean> buildEntryForBlock(String key, Instant expiresAt) {

    final var ops = redisTemplate.opsForSet();
    return jsonWebKeyPairProvider
        .jsonWebKeyPairs()
        .map(JsonWebKeySet::toJson)
        .take(authProperties.getSigningKeysPerBlock())
        .collectList()
        .flatMap(keys -> ops.add(key, keys.toArray(String[]::new)))
        .then(redisTemplate.expireAt(key, expiresAt));
  }

  /**
   * Builds an entry that will expire for a given block
   *
   * @param startingInstantForSigningKeyTimeBlock
   * @return Boolean mono if the expiration was set up correctly
   */
  public Mono<Boolean> buildEntryIfItDoesNotExistForBlock(
      Instant startingInstantForSigningKeyTimeBlock) {

    final var key = redisKeyBlocks.forSigningRedisKey(startingInstantForSigningKeyTimeBlock);
    // expire 3x the block size
    final var expiresAt =
        startingInstantForSigningKeyTimeBlock
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds());
    log.debug("populating redis key={} expiration={}", key, expiresAt);

    return updateExpirationAndHasKey(key, expiresAt) // don't bother if there's data
        .log("Exists")
        .filter(exists -> !exists) // don't bother if there's data
        .log("Missing")
        .flatMap(ignored -> buildEntryForBlock(key, expiresAt));
  }

  private Mono<Boolean> updateExpirationAndHasKey(String key, Instant expiresAt) {

    return redisTemplate
        .hasKey(key)
        .flatMap(
            exists -> {
              if (Boolean.TRUE.equals(exists)) {
                return redisTemplate.expireAt(key, expiresAt);
              } else {
                return Mono.just(false);
              }
            });
  }
}
