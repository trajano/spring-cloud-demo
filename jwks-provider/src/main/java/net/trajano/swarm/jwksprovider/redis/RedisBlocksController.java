package net.trajano.swarm.jwksprovider.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.Blocks;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RedisBlocksController {

  private final ReactiveStringRedisTemplate redisTemplate;

  private final RedisKeyBlocks redisKeyBlocks;

  private Flux<String> getKeyPairs(final String redisKey) {
    final ReactiveSetOperations<String, String> setOps = redisTemplate.opsForSet();
    return redisTemplate
        .hasKey(redisKey)
        .flatMapMany(exists -> Boolean.TRUE.equals(exists) ? setOps.scan(redisKey) : Flux.empty());
  }

  private String getKid(String jwks) {

    try {
      return new JsonWebKeySet(jwks)
          .getJsonWebKeys().stream()
              .filter(jwk -> jwk.getKeyType().equals("EC"))
              .map(JsonWebKey::getKeyId)
              .findAny()
              .orElseThrow();
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  @GetMapping("/redis")
  Mono<Blocks> blocks() {

    final var key = redisKeyBlocks.previousSigningRedisKey();
    log.error("key={}", key);
    return Mono.zip(
            getKeyPairs(key).map(this::getKid).collectList(),
            getKeyPairs(redisKeyBlocks.currentSigningRedisKey()).map(this::getKid).collectList(),
            getKeyPairs(redisKeyBlocks.nextSigningRedisKey()).map(this::getKid).collectList())
        .map(
            t ->
                Blocks.builder()
                    .previousSigningRedisKey(key)
                    .hasPreviousSigningRedisKey(t.getT1())
                    .currentSigningRedisKey(redisKeyBlocks.currentSigningRedisKey())
                    .hasCurrentSigningRedisKey(t.getT2())
                    .nextSigningRedisKey(redisKeyBlocks.nextSigningRedisKey())
                    .hasNextSigningRedisKey(t.getT3())
                    .build());
  }
}
