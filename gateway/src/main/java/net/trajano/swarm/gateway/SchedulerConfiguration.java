package net.trajano.swarm.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Configuration
public class SchedulerConfiguration {
  @Bean
  Scheduler jwtConsumerScheduler() {
    return Schedulers.newBoundedElastic(
        Runtime.getRuntime().availableProcessors() + 1,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "jwtConsumer");
  }

  @Bean
  Scheduler jwksScheduler() {
    return Schedulers.newBoundedElastic(
        Runtime.getRuntime().availableProcessors() + 1,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "jwks");
  }

  @Bean
  Scheduler penalty() {
    return Schedulers.newParallel("penalty");
  }

  /**
   * Sets the refresh token is an unbounded queue which number of processors + 1 is active
   *
   * @return scheduler.
   */
  @Bean
  Scheduler refreshTokenScheduler() {
    return Schedulers.newBoundedElastic(
        Runtime.getRuntime().availableProcessors() + 1,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "refreshToken");
  }
}
