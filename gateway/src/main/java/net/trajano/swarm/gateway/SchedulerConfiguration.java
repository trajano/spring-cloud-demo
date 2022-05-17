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
}
