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
    return Schedulers.newParallel("grpc");
  }

  @Bean
  Scheduler jwksScheduler() {
    return Schedulers.boundedElastic();
    //    return Schedulers.newBoundedElastic(
    //        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
    //        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
    //        "jwks");
  }

  @Bean
  Scheduler jwtConsumerScheduler() {
    return Schedulers.boundedElastic();
    //    return Schedulers.newBoundedElastic(
    //        Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
    //        Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
    //        "jwtConsumer");
  }

  /**
   * This is used for signing JWTs. It is capped by the processors rather than a large multiplier as
   * this is a CPU intensive operation and running many in parallel will have detrimental impact.
   *
   * <p>This is capped so there's not too many requests to do this operation. So it will be bounded
   * by queue of no more than a set amount that is a function of the number of processors
   *
   * @return scheduler
   */
  @Bean
  Scheduler jwtSigningScheduler() {
    return Schedulers.newBoundedElastic(
        Runtime.getRuntime().availableProcessors() + 1,
        Runtime.getRuntime().availableProcessors() * 5,
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
