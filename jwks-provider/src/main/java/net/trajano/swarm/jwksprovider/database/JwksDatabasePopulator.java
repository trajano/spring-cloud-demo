package net.trajano.swarm.jwksprovider.database;

import java.time.Duration;
import java.time.Instant;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import net.trajano.swarm.gateway.common.dao.BlockSigningKeys;
import net.trajano.swarm.gateway.common.dao.JsonWebKeyPairs;
import net.trajano.swarm.gateway.common.dao.RefreshTokens;
import net.trajano.swarm.gateway.common.domain.BlockSigningKey;
import net.trajano.swarm.gateway.common.domain.JsonWebKeyPair;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@DependsOn("liquibase")
public class JwksDatabasePopulator {

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final JsonWebKeyPairProvider jsonWebKeyPairProvider;

  private final BlockSigningKeys blockSigningKeys;

  private final JsonWebKeyPairs jsonWebKeyPairs;

  private Disposable subscription;

  private Flux<BlockSigningKey> generateSigningKeysBlock(final long epochSecondsBlock) {

    return jsonWebKeyPairProvider
        .jsonWebKeyPairs()
        .take(authProperties.getSigningKeysPerBlock())
        .flatMapSequential(jsonWebKeyPairs::save)
        .map(JsonWebKeyPair::keyId)
        .map(kid -> new BlockSigningKey(null, epochSecondsBlock, kid))
        .flatMapSequential(blockSigningKeys::save);
  }

  private final RefreshTokens refreshTokens;
  /**
   * Populates the database with the signing keys. This scans the current and the next one to
   * determine which needs to be populated.
   *
   * @param ignored ignored
   * @return void mono
   */
  private Mono<Void> populateDatabase(Instant ignored) {

    final var now = Instant.now();
    final var previousEpochSecondsBlock =
        redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, -1);
    final var currentEpochSecondsBlock =
        redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0);
    final var nextEpochSecondsBlock = redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 1);

    final var removeExpiredEntries =
        refreshTokens
            .deleteExpiredOn(now)
            .then(blockSigningKeys.deleteBlocksOlderThanBlock(previousEpochSecondsBlock))
            .then(jsonWebKeyPairs.deleteUnused());

    // Only pick one either current or next
    final Mono<Instant> keyAndIndexToPopulate =
        blockSigningKeys
            .findAllByEpochSecondsBlock(currentEpochSecondsBlock)
            .hasElements()
            .flatMap(
                exists ->
                    Boolean.TRUE.equals(exists)
                        ? Mono.empty()
                        : Mono.just(currentEpochSecondsBlock))
            .switchIfEmpty(
                blockSigningKeys
                    .findAllByEpochSecondsBlock(nextEpochSecondsBlock)
                    .hasElements()
                    .flatMap(
                        exists ->
                            Boolean.TRUE.equals(exists)
                                ? Mono.empty()
                                : Mono.just(nextEpochSecondsBlock)));

    return keyAndIndexToPopulate
        .map(Instant::getEpochSecond)
        .flatMapMany(this::generateSigningKeysBlock)
        .then(removeExpiredEntries);
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void start() {

    subscription =
        Mono.fromCallable(Instant::now)
            .delayElement(Duration.ofSeconds(10))
            .repeat()
            .flatMap(this::populateDatabase)
            .subscribe();
  }

  @PreDestroy
  @SuppressWarnings("unused")
  public void stop() {

    subscription.dispose();
  }
}
