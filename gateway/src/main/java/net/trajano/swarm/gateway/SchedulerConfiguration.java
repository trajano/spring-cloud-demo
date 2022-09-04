package net.trajano.swarm.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Configuration
public class SchedulerConfiguration {
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
        Runtime.getRuntime().availableProcessors() + 1, Integer.MAX_VALUE, "refreshToken");
  }
}
