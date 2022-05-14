package net.trajano.swarm.gateway;

import io.awspring.cloud.autoconfigure.condition.ConditionalOnAwsCloudEnvironment;
import io.micrometer.cloudwatch2.CloudWatchConfig;
import io.micrometer.cloudwatch2.CloudWatchMeterRegistry;
import io.micrometer.core.instrument.Clock;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.cloudwatch.CloudWatchAsyncClient;

@Component
@ConditionalOnAwsCloudEnvironment
public class MicrometerConfiguration {
  @Bean
  MeterRegistry meterRegistry() {

    CloudWatchConfig cloudWatchConfig =
        new CloudWatchConfig() {
          @Override
          public String get(String s) {

            return null;
          }

          @Override
          public Duration step() {

            return Duration.ofSeconds(5);
          }

          @Override
          public String namespace() {

            return "g2";
          }
        };
    return new CloudWatchMeterRegistry(
        cloudWatchConfig, Clock.SYSTEM, CloudWatchAsyncClient.create());
  }
}
