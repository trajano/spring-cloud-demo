package net.trajano.swarm.jwksprovider.redis;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class Scheduler implements InitializingBean, DisposableBean {
  private final JwksRedisPopulator jwksRedisPopulator;
  private final RedisKeyBlocks redisKeyBlocks;
  private final UserSessionCleaner userSessionCleaner;
  private Disposable subscription;

  /** Populate then wait then repeat */
  @Override
  public void afterPropertiesSet() {

    subscription =
        populateRedis(Instant.now())
            .then(delayedUntilNextBlock())
            .repeat()
            .flatMap(this::populateRedis)
            .subscribe();
  }

  private Mono<Instant> delayedUntilNextBlock() {
    return Mono.fromCallable(Instant::now)
        .delayUntil(
            now ->
                Mono.just(now)
                    .delayElement(
                        Duration.between(
                            now, redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 1))))
        .then(Mono.fromCallable(Instant::now));
  }

  @Override
  public void destroy() {

    subscription.dispose();
  }

  private Mono<Void> populateRedis(Instant now) {

    // build the entry if it does not exist
    return jwksRedisPopulator
        .buildEntryIfItDoesNotExistForBlock(
            redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0))
        .then(
            jwksRedisPopulator.buildEntryIfItDoesNotExistForBlock(
                redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 1)))
        .then(userSessionCleaner.cleanUserSessionsThatDoNotHaveExpiration());
  }
}
