package net.trajano.swarm.gateway.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Configuration
public class CounterProvider {

  private String metricPrefix = "gateway";

  @Bean
  Counter attemptedAuthenticationRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".authentication.attempted")
        .description("Attempted authentication requests")
        .register(meterRegistry);
  }

  @Bean
  Counter failedAuthenticationRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".authentication.failed")
            .description("Failed authentication requests")
            .register(meterRegistry);
  }
  @Bean
  Counter failedAuthenticationRequestsDueToInvalidCredentials(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".authentication.failure.invalid-credentials")
            .description("Failed authentication requests")
            .register(meterRegistry);
  }

  @Bean
  Counter failedLogoutRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".logout.failed").register(meterRegistry);
  }

  @Bean
  Counter succeededApiRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".api.succeeded")
        .description("Successful API calls registered by the gateway")
        .register(meterRegistry);
  }

  @Bean
  Counter succeededAuthenticationRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".authentication.succeeded")
        .description("Successful authentication requests")
        .register(meterRegistry);
  }

  @Bean
  Counter succeededLogoutRequests(MeterRegistry meterRegistry) {

    return meterRegistry.counter(metricPrefix + ".logout.succeeded");
  }

  //  @Bean
  //  MeterBinder successfulAuthenticationRequests() {
  //    return registry -> Counter.builder("Authentication.success").register(registry);
  //  }

  @Bean
  Counter successfulRefreshRequests(MeterRegistry meterRegistry) {

    return Counter.builder(metricPrefix + ".auth.refresh.success").register(meterRegistry);
  }
}
