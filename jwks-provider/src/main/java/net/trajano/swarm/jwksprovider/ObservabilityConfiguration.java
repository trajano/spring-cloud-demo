package net.trajano.swarm.jwksprovider;

import io.lettuce.core.resource.ClientResources;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.observability.MicrometerTracingAdapter;

@Configuration
class ObservabilityConfiguration {

  @Bean
  public ClientResources clientResources(
      ObservationRegistry observationRegistry,
      @Value("${spring.data.redis.host:redis}") final String redisServiceName) {

    return ClientResources.builder()
        .tracing(new MicrometerTracingAdapter(observationRegistry, redisServiceName))
        .build();
  }

  @Bean
  public LettuceClientConfigurationBuilderCustomizer
      observabilityLettuceClientConfigurationBuilderCustomizer(ClientResources clientResources) {

    return clientConfigurationBuilder -> {
      clientConfigurationBuilder.clientResources(clientResources);
    };
  }
}
