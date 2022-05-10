package net.trajano.swarm.gateway.jwks;

import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class RedisJwksProvider implements JwksProvider {

  private static final String RSA = "RSA";

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  final Scheduler scheduler = Schedulers.newParallel("jwks");

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    final ReactiveSetOperations<String, String> setOps = redisTemplate.opsForSet();

    return redisTemplate
        .getExpire(redisKeyBlocks.currentSigningRedisKey())
        .flatMap(
            duration ->
                Flux.just(
                        redisKeyBlocks.previousSigningRedisKey(),
                        redisKeyBlocks.currentSigningRedisKey())
                    .flatMap(setOps::members)
                    .publishOn(scheduler)
                    .map(RedisJwksProvider::stringToJwks)
                    .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
                    .filter(jwk -> RSA.equals(jwk.getKeyType()))
                    .collectList()
                    .map(JsonWebKeySet::new)
                    .cache(duration));
  }

  private Mono<Boolean> adjustExpiration(int accessTokenExpirationInSeconds) {

    return redisTemplate
        .expireAt(
            redisKeyBlocks.currentSigningRedisKey(),
            redisKeyBlocks.nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration(
                accessTokenExpirationInSeconds))
        .publishOn(Schedulers.boundedElastic());
  }

  @Override
  public Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds) {

    return adjustExpiration(accessTokenExpirationInSeconds)
        .flatMap(
            x -> {
              final var opsForSet = redisTemplate.opsForSet();
              return opsForSet
                  .randomMember(redisKeyBlocks.currentSigningRedisKey())
                  .map(RedisJwksProvider::stringToJwks);
            })
        .publishOn(Schedulers.boundedElastic());
  }

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }
}
