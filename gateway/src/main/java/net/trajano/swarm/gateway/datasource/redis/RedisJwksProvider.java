package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "auth", name = "datasource", havingValue = "REDIS")
public class RedisJwksProvider implements JwksProvider {

  private static final String RSA = "RSA";

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  final Scheduler scheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwks");

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return jsonWebKeySetWithDuration().map(Tuple2::getT1);
  }

  @Override
  public Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration() {

    final ReactiveSetOperations<String, String> setOps = redisTemplate.opsForSet();

    return redisTemplate
        .getExpire(redisKeyBlocks.currentSigningRedisKey())
        .flatMap(
            duration ->
                Mono.zip(
                    Flux.just(
                            redisKeyBlocks.previousSigningRedisKey(),
                            redisKeyBlocks.currentSigningRedisKey())
                        .flatMap(setOps::members)
                        .publishOn(scheduler)
                        .map(RedisJwksProvider::stringToJwks)
                        .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
                        .filter(jwk -> RSA.equals(jwk.getKeyType()))
                        .collectList()
                        .map(JsonWebKeySet::new),
                    Mono.just(duration)));
  }

  private Mono<Boolean> adjustExpiration(int accessTokenExpirationInSeconds) {

    return redisTemplate
        .expireAt(
            redisKeyBlocks.currentSigningRedisKey(),
            redisKeyBlocks.nextTimeBlockForSigningKeysAdjustedForAccessTokenExpiration(
                accessTokenExpirationInSeconds))
        .publishOn(scheduler);
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
        .publishOn(scheduler);
  }

  /**
   * Gets all the verification JWKs but generally won't be used because the JWT is part of the data
   *
   * @return
   */
  @Override
  public Mono<List<JsonWebKey>> getAllVerificationJwks() {

    return redisUserSessions.findAll().map(UserSession::getVerificationJwk).collectList();
  }

  private final RedisUserSessions redisUserSessions;

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }
}
