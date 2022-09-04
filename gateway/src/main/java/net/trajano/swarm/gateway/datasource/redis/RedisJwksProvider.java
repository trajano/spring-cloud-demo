package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwk.JsonWebKey;
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

  private static final String RSA = "RSA";

  private final Scheduler jwksScheduler;

  private final RedisUserSessions redisUserSessions;

  private final Mono<JsonWebKeySet> cachedJsonWebKeySet;

  private final Mono<List<JsonWebKeySet>> cachedSigningJsonWebKeySet;

  public RedisJwksProvider(
      Scheduler jwksScheduler,
      RedisKeyBlocks redisKeyBlocks,
      ReactiveStringRedisTemplate redisTemplate,
      RedisUserSessions redisUserSessions) {

    this.jwksScheduler = jwksScheduler;
    this.redisUserSessions = redisUserSessions;

    final var setOps = redisTemplate.opsForSet();

    final var lastProcessedRedisSigningKeyForJwks = new AtomicReference<String>(null);
    this.cachedJsonWebKeySet =
        Flux.just(redisKeyBlocks.previousSigningRedisKey(), redisKeyBlocks.currentSigningRedisKey())
            .publishOn(jwksScheduler)
            .flatMap(setOps::members)
            .map(RedisJwksProvider::stringToJwks)
            .flatMap(keySet -> Flux.fromIterable(keySet.getJsonWebKeys()))
            .filter(jwk -> RSA.equals(jwk.getKeyType()))
            .reduceWith(
                JsonWebKeySet::new,
                (acc, current) -> {
                  acc.addJsonWebKey(current);
                  return acc;
                })
            .doOnNext(
                ignored ->
                    lastProcessedRedisSigningKeyForJwks.set(
                        redisKeyBlocks.currentSigningRedisKey()))
            .cacheInvalidateIf(
                ignored ->
                    !redisKeyBlocks
                        .currentSigningRedisKey()
                        .equals(lastProcessedRedisSigningKeyForJwks.get()));

    final var lastProcessedRedisSigningKeyForSigningKeys = new AtomicReference<String>(null);

    this.cachedSigningJsonWebKeySet =
        setOps
            .members(redisKeyBlocks.currentSigningRedisKey())
            .publishOn(jwksScheduler)
            .map(RedisJwksProvider::stringToJwks)
            .collectList()
            .doOnNext(
                ignored ->
                    lastProcessedRedisSigningKeyForSigningKeys.set(
                        redisKeyBlocks.currentSigningRedisKey()))
            .cacheInvalidateIf(
                ignored ->
                    !redisKeyBlocks
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

  /**
   * Gets all the verification JWKs but generally won't be used because the JWT is part of the data
   *
   * @return all the verification JWKs.
   */
  @Override
  public Mono<List<JsonWebKey>> getAllVerificationJwks() {

    return redisUserSessions
        .findAll()
        .publishOn(jwksScheduler)
        .map(UserSession::getVerificationJwk)
        .collectList();
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
