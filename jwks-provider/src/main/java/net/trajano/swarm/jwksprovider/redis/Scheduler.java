package net.trajano.swarm.jwksprovider.redis;

import java.time.Duration;
import java.time.Instant;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
public class Scheduler {
  private final JwksRedisPopulator jwksRedisPopulator;
  private final RedisKeyBlocks redisKeyBlocks;
  private final UserSessionCleaner userSessionCleaner;
  private Disposable subscription;

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

  @PostConstruct
  public void start() {

    subscription =
        Mono.fromCallable(Instant::now)
            .delayElement(Duration.ofSeconds(10))
            .repeat()
            .flatMap(this::populateRedis)
            .subscribeOn(Schedulers.boundedElastic())
            .subscribe();
  }

  @PreDestroy
  @SuppressWarnings("unused")
  public void stop() {

    subscription.dispose();
  }
}
