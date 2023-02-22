package net.trajano.swarm.sampleservice;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CounterProvider {

  @Bean
  Counter successfulApiRequests(MeterRegistry meterRegistry) {

    return Counter.builder("sample.api.calls.success")
        .description("Successful API calls")
        .register(meterRegistry);
  }
}
