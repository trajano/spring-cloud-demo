package net.trajano.swarm.gateway.jwks;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import net.trajano.swarm.gateway.common.dao.BlockSigningKeys;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

@Service
@RequiredArgsConstructor
@Primary
public class DatabaseJwksProvider implements JwksProvider {

  private static final String RSA = "RSA";

  private final Scheduler scheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwks");

  private final RedisKeyBlocks redisKeyBlocks;

  private final BlockSigningKeys blockSigningKeys;

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  @Override
  public Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds) {

    final var now = Instant.now();
    return blockSigningKeys
        .jwksForBlock(redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0))
        .publishOn(scheduler)
        .collectList()
        .map(list -> list.get(ThreadLocalRandom.current().nextInt(list.size())))
        .map(DatabaseJwksProvider::stringToJwks);
  }

  /**
   * Only needs to return previous and current keys.
   *
   * @return jwks
   */
  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return jsonWebKeySetWithDuration().map(Tuple2::getT1);
  }

  /**
   * Only needs to return previous and current keys.
   *
   * @return jwks
   */
  @Override
  public Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration() {

    final var now = Instant.now();
    var previousBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, -1);
    var currentBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0);

    return Mono.zip(
        blockSigningKeys
            .jwksForBlocks(previousBlock, currentBlock)
            .map(DatabaseJwksProvider::stringToJwks)
            .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
            .filter(jwk -> RSA.equals(jwk.getKeyType()))
            .collectList()
            .map(JsonWebKeySet::new),
        Mono.just(Duration.ofSeconds(1)));
  }
}
