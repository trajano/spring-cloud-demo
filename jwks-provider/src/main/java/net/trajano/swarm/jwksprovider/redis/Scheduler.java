package net.trajano.swarm.jwksprovider.redis;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.IntervalTask;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class Scheduler implements SchedulingConfigurer {
  private final JwksRedisPopulator jwksRedisPopulator;
  private final RedisKeyBlocks redisKeyBlocks;
  private final UserSessionCleaner userSessionCleaner;
  private final AuthProperties authProperties;

  /**
   * Places the initial data then starts it to the next block then runs it at an interval
   *
   * @param taskRegistrar the registrar to be configured.
   */
  @Override
  public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {

    populateRedis(Instant.now());
    var now = Instant.now();
    final var task =
        new IntervalTask(
            () -> populateRedis(Instant.now()),
            authProperties.getSigningKeyBlockSizeInSeconds() * 1000L,
            ChronoUnit.MILLIS.between(
                now, redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 1)));
    taskRegistrar.addFixedRateTask(task);
  }

  private void populateRedis(Instant now) {

    // build the entry if it does not exist
    jwksRedisPopulator.buildEntryIfItDoesNotExistForBlock(
        redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 0));
    jwksRedisPopulator.buildEntryIfItDoesNotExistForBlock(
        redisKeyBlocks.startingInstantForSigningKeyTimeBlock(now, 1));
    userSessionCleaner.cleanUserSessionsThatDoNotHaveExpiration();
  }
}
