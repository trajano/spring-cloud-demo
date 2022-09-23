package net.trajano.swarm.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Configuration
public class SchedulerConfiguration {

  @Bean
  Scheduler authenticationScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "authentication");
  }

  @Bean
  Scheduler grpcScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "grpc");
  }

  @Bean
  Scheduler jwksScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "jwks");
  }

  @Bean
  Scheduler jwtConsumerScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "jwtConsumer");
  }

  /**
   * This is used for signing JWTs. It is capped by the processors rather than a large multiplier as
   * this is a CPU intensive operation and running many in parallel will have detrimental impact.
   *
   * @return scheduler
   */
  @Bean
  Scheduler jwtSigningScheduler() {
    return Schedulers.newBoundedElastic(
        Runtime.getRuntime().availableProcessors() + 1,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "jwtSigning");
  }

  @Bean
  Scheduler logoutScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "logout");
  }

  @Bean
  Scheduler penalty() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "penalty");
  }

  /**
   * Sets the refresh token is an unbounded queue which number of processors + 1 is active
   *
   * @return scheduler.
   */
  @Bean
  Scheduler refreshTokenScheduler() {
    return Schedulers.newBoundedElastic(
        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
        "refreshToken");
  }
}
