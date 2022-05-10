package net.trajano.swarm.gateway.jwks;

import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.ReactiveHealthIndicator;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Checks if the current or previous signing keys are present. */
@Component
@RequiredArgsConstructor
public class JwksHealthIndicator implements ReactiveHealthIndicator {

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  @Override
  public Mono<Health> health() {

    final ReactiveSetOperations<String, String> setOps = redisTemplate.opsForSet();
    return Flux.just(
            redisKeyBlocks.previousSigningRedisKey(), redisKeyBlocks.currentSigningRedisKey())
        .flatMap(setOps::members)
        .count()
        .map(
            count -> {
              if (count == 0) {
                return Health.down()
                    .withDetail(RedisJwksProvider.class.getName(), "No JWKS available")
                    .build();
              } else {
                return Health.up().build();
              }
            });
  }
}
