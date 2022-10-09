package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.jose4j.jwk.EllipticCurveJsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

@Service
@ConditionalOnProperty(
    prefix = "auth",
    name = "datasource",
    havingValue = "REDIS",
    matchIfMissing = true)
public class RedisJwksProvider implements JwksProvider {

  private final Scheduler jwksScheduler;

  private final RedisUserSessions redisUserSessions;

  private final Mono<JsonWebKeySet> cachedJsonWebKeySet;

  private final Mono<List<JsonWebKeySet>> cachedSigningJsonWebKeySet;

  private Mono<JsonWebKeySet> getJsonWebKeySet(
      RedisKeyBlocks redisKeyBlocks, ReactiveStringRedisTemplate redisTemplate) {

    final var setOps = redisTemplate.opsForSet();
    return Mono.fromSupplier(Instant::now)
        .flatMapMany(
            now ->
                Flux.just(
                    redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, -1),
                    redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0)))
        .map(redisKeyBlocks::forSigningRedisKey)
        .flatMap(setOps::members)
        .map(RedisJwksProvider::stringToJwks)
        .flatMap(keySet -> Flux.fromIterable(keySet.getJsonWebKeys()))
        .filter(jwk -> EllipticCurveJsonWebKey.KEY_TYPE.equals(jwk.getKeyType()))
        .reduceWith(
            JsonWebKeySet::new,
            (acc, current) -> {
              acc.addJsonWebKey(current);
              return acc;
            });
  }

  private Mono<List<JsonWebKeySet>> getSigningJsonWebKeySets(
      RedisKeyBlocks redisKeyBlocks, ReactiveStringRedisTemplate redisTemplate) {

    final var setOps = redisTemplate.opsForSet();
    return Mono.fromSupplier(Instant::now)
        .map(now -> redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0))
        .map(redisKeyBlocks::forSigningRedisKey)
        .flatMapMany(setOps::members)
        .map(RedisJwksProvider::stringToJwks)
        .collectList();
  }

  public RedisJwksProvider(
      Scheduler jwksScheduler,
      RedisKeyBlocks redisKeyBlocks,
      ReactiveStringRedisTemplate redisTemplate,
      RedisUserSessions redisUserSessions) {

    this.jwksScheduler = jwksScheduler;
    this.redisUserSessions = redisUserSessions;

    final var lastProcessedRedisSigningKeyForJwks = new AtomicReference<String>(null);
    this.cachedJsonWebKeySet =
        getJsonWebKeySet(redisKeyBlocks, redisTemplate)
            .doOnNext(
                ignored ->
                    lastProcessedRedisSigningKeyForJwks.set(
                        redisKeyBlocks.currentSigningRedisKey()))
            .cacheInvalidateIf(
                data ->
                    data.getJsonWebKeys().isEmpty()
                        || !redisKeyBlocks
                            .currentSigningRedisKey()
                            .equals(lastProcessedRedisSigningKeyForJwks.get()));

    final var lastProcessedRedisSigningKeyForSigningKeys = new AtomicReference<String>(null);

    this.cachedSigningJsonWebKeySet =
        getSigningJsonWebKeySets(redisKeyBlocks, redisTemplate)
            .doOnNext(
                ignored ->
                    lastProcessedRedisSigningKeyForSigningKeys.set(
                        redisKeyBlocks.currentSigningRedisKey()))
            .cacheInvalidateIf(
                data ->
                    data.isEmpty()
                        || !redisKeyBlocks
                            .currentSigningRedisKey()
                            .equals(lastProcessedRedisSigningKeyForSigningKeys.get()));
  }

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  @Override
  public Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds) {

    return cachedSigningJsonWebKeySet.map(
        list -> list.get(ThreadLocalRandom.current().nextInt(list.size())));
  }

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return cachedJsonWebKeySet;
  }

  @Override
  public Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration() {

    throw new UnsupportedOperationException();
  }
}
