package net.trajano.swarm.jwksprovider.redis;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.JsonWebKeyPairProvider;
import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class JwksRedisPopulator {

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  private final JsonWebKeyPairProvider jsonWebKeyPairProvider;

  private Mono<Void> buildEntryForBlock(String key) {

    final var ops = redisTemplate.opsForSet();
    return jsonWebKeyPairProvider
        .jsonWebKeyPairs()
        .map(JsonWebKeySet::toJson)
        .take(authProperties.getSigningKeysPerBlock())
        .collectList()
        .flatMap(keys -> ops.add(key, keys.toArray(String[]::new)))
        .then();
  }

  public Mono<Void> buildEntryIfItDoesNotExistForBlock(
      Instant startingInstantForSigningKeyTimeBlock) {

    final var key = redisKeyBlocks.forSigningRedisKey(startingInstantForSigningKeyTimeBlock);
    // expire 3x the block size
    final var expiresAt =
        startingInstantForSigningKeyTimeBlock
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds())
            .plusSeconds(authProperties.getSigningKeyBlockSizeInSeconds());
    return updateExpirationAndHasKey(key, expiresAt) // don't bother if there's data
        .filter(exists -> !exists) // don't bother if there's data
        .flatMap(ignored -> buildEntryForBlock(key));
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
