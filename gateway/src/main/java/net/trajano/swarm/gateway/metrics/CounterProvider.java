package net.trajano.swarm.gateway.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CounterProvider {

  private String metricPrefix = "gateway";

  @Bean
  Counter invalidLogoutRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter("Logout.invalid", "group", "logout", "state", "invalid");
  }

  @Bean
  Counter successfulLogoutRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter(
        metricPrefix + ".auth.logout.success", "group", "logout", "state", "ok");
  }

  @Bean
  Counter successfulRefreshRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".auth.refresh.success")
        .tag("group", "refresh")
        .tag("state", "ok")
        .register(meterRegistry);
  }

  @Bean
  Counter successfulAuthenticationRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".auth.authentication.success")
        .tag("group", "authentication")
        .tag("state", "ok")
        .register(meterRegistry);
  }

  //  @Bean
  //  MeterBinder successfulAuthenticationRequests() {
  //    return registry -> Counter.builder("Authentication.success").register(registry);
  //  }

  @Bean
  Counter successfulApiRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".api.calls.success")
        .tag("group", "api")
        .tag("state", "ok")
        .register(meterRegistry);
  }
}
