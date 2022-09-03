package net.trajano.swarm.gateway.datasource.database;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;
import net.trajano.swarm.gateway.common.dao.BlockSigningKeys;
import net.trajano.swarm.gateway.common.dao.JsonWebKeyPairs;
import net.trajano.swarm.gateway.common.domain.JsonWebKeyPair;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.MonoSink;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

@Service
@ConditionalOnProperty(prefix = "auth", name = "datasource", havingValue = "DATABASE")
public class DatabaseJwksProvider implements JwksProvider {

  private static final String RSA = "RSA";

  private final Scheduler scheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwks");

  private final RedisKeyBlocks redisKeyBlocks;

  private final BlockSigningKeys blockSigningKeys;

  /** This is a JWKS containing public keys only for signature verification. */
  private final Mono<JsonWebKeySet> jwksCacheMono;

  /** This is a list of possible JWKS containing a private-public pair suitable for signing. */
  private final Mono<List<JsonWebKeySet>> currentSigningJwksCacheMono;

  /** This is a JWKS containing all signature validation keys to the system. */
  private final Mono<List<JsonWebKey>> allVerificationJwksCacheMono;

  /** This tracks when the cached JWKS monos were last updated. */
  private final AtomicReference<Instant> computeJwksFromDataLastUpdate;

  private final AtomicReference<Instant> computeJwksFromDatabaseCurrentOnlyLastUpdate;
  private final AtomicReference<Instant> computeAllSignatureVerificationJwksFromDatabaseLastUpdate;

  private final JsonWebKeyPairs jsonWebKeyPairs;

  public DatabaseJwksProvider(
      RedisKeyBlocks redisKeyBlocks,
      BlockSigningKeys blockSigningKeys,
      JsonWebKeyPairs jsonWebKeyPairs) {

    this.redisKeyBlocks = redisKeyBlocks;

    this.blockSigningKeys = blockSigningKeys;

    this.jsonWebKeyPairs = jsonWebKeyPairs;

    computeJwksFromDataLastUpdate = new AtomicReference<>(Instant.MIN);
    computeJwksFromDatabaseCurrentOnlyLastUpdate = new AtomicReference<>(Instant.MIN);
    computeAllSignatureVerificationJwksFromDatabaseLastUpdate = new AtomicReference<>(Instant.MIN);
    jwksCacheMono =
        Mono.create(this::computeJwksFromDatabase)
            .cacheInvalidateIf(ignored -> needsUpdating(ignored, computeJwksFromDataLastUpdate));
    currentSigningJwksCacheMono =
        Mono.create(this::computeJwksFromDatabaseCurrentOnly)
            .cacheInvalidateIf(
                ignored -> needsUpdating(ignored, computeJwksFromDatabaseCurrentOnlyLastUpdate));
    allVerificationJwksCacheMono =
        Mono.create(this::computeAllSignatureVerificationJwksFromDatabase)
            .cacheInvalidateIf(
                ignored ->
                    needsUpdating(
                        ignored, computeAllSignatureVerificationJwksFromDatabaseLastUpdate));
  }

  private void computeAllSignatureVerificationJwksFromDatabase(MonoSink<List<JsonWebKey>> sink) {

    var currentBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(Instant.now(), 0);
    jsonWebKeyPairs
        .findAll()
        .map(JsonWebKeyPair::jwk)
        .map(DatabaseJwksProvider::stringToJwks)
        .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
        .filter(jwk -> RSA.equals(jwk.getKeyType()))
        .collectList()
        .doOnNext(sink::success)
        .doOnNext(i -> computeAllSignatureVerificationJwksFromDatabaseLastUpdate.set(currentBlock))
        .subscribe();
  }

  private static JsonWebKeySet stringToJwks(String s) {

    try {
      return new JsonWebKeySet(s);
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  private void computeJwksFromDatabase(MonoSink<JsonWebKeySet> sink) {

    final var now = Instant.now();
    var previousBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, -1);
    var currentBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0);

    blockSigningKeys
        .jwksForBlocks(previousBlock, currentBlock)
        .map(DatabaseJwksProvider::stringToJwks)
        .flatMap(jwks -> Flux.fromIterable(jwks.getJsonWebKeys()))
        .filter(jwk -> RSA.equals(jwk.getKeyType()))
        .collectList()
        .map(JsonWebKeySet::new)
        .doOnNext(sink::success)
        .doOnNext(i -> computeJwksFromDataLastUpdate.set(currentBlock))
        .subscribe();
  }

  private void computeJwksFromDatabaseCurrentOnly(MonoSink<List<JsonWebKeySet>> sink) {
    final var now = Instant.now();
    var currentBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0);

    blockSigningKeys
        .jwksForBlock(currentBlock)
        .map(DatabaseJwksProvider::stringToJwks)
        .collectList()
        .doOnNext(sink::success)
        .doOnNext(i -> computeJwksFromDatabaseCurrentOnlyLastUpdate.set(currentBlock))
        .subscribe();
  }

  @Override
  public Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds) {

    return currentSigningJwksCacheMono.map(
        list -> list.get(ThreadLocalRandom.current().nextInt(list.size())));
  }

  @Override
  public Mono<List<JsonWebKey>> getAllVerificationJwks() {

    return allVerificationJwksCacheMono;
  }

  /**
   * Only needs to return previous and current keys.
   *
   * @return jwks
   */
  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return jwksCacheMono;
  }

  /**
   * Only needs to return previous and current keys.
   *
   * @return jwks
   */
  @Override
  public Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration() {

    return Mono.zip(jwksCacheMono, Mono.just(Duration.ofSeconds(1)));
  }

  /**
   * Check if an update is needed. An update is needed if the last publish block is no longer the
   * current block.
   *
   * @param ignored ignored
   * @param lastUpdateRef ref
   * @return true if update is need
   */
  private boolean needsUpdating(Object ignored, AtomicReference<Instant> lastUpdateRef) {

    var currentBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(Instant.now(), 0);

    return !currentBlock.equals(lastUpdateRef.get());
  }
}
