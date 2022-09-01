package net.trajano.swarm.gateway.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CounterProvider {

  @Bean
  Counter invalidLogoutRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter("Logout.invalid", "group", "logout", "state", "invalid");
  }

  @Bean
  Counter successfulLogoutRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter("Logout.success", "group", "logout", "state", "ok");
  }

  @Bean
  Counter successfulRefreshRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter("Refresh.success", "group", "refresh", "state", "ok");
  }

  @Bean
  Counter successfulAuthenticationRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter(
        "Authentication.success", "group", "authentication", "state", "ok");
  }

  @Bean
  Counter successfulApiRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter("API.success", "group", "api", "state", "ok");
  }
}
