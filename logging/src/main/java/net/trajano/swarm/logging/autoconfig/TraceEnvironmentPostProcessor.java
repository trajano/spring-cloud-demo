package net.trajano.swarm.logging.autoconfig;

import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

class TraceEnvironmentPostProcessor implements EnvironmentPostProcessor {

  private static final String DEFAULT_PROPERTIES_SOURCE_NAME = "defaultProperties";

  @Override
  public void postProcessEnvironment(
      final ConfigurableEnvironment environment, final SpringApplication application) {

    final Map<String, Object> map = new HashMap<>();
    final boolean sleuthEnabled =
        environment.getProperty("spring.sleuth.enabled", Boolean.class, true);
    final boolean sleuthDefaultLoggingPatternEnabled =
        environment.getProperty(
            "spring.sleuth.default-logging-pattern-enabled", Boolean.class, true);
    if (sleuthEnabled && sleuthDefaultLoggingPatternEnabled) {
      map.put(
          "logging.pattern.level",
          "%5p [${spring.zipkin.service.name:${spring.application.name:}},%X{traceId:-},%X{spanId:-}]");
      String neverRefreshables =
          environment.getProperty(
              "spring.cloud.refresh.never-refreshable", "com.zaxxer.hikari.HikariDataSource");
      map.put(
          "spring.cloud.refresh.never-refreshable",
          neverRefreshables
              + ",org.springframework.cloud.sleuth.instrument.jdbc.DataSourceWrapper");
    }
    final var propertySources = environment.getPropertySources();

    if (propertySources.contains(DEFAULT_PROPERTIES_SOURCE_NAME)) {
      final var source = propertySources.get(DEFAULT_PROPERTIES_SOURCE_NAME);
      if (source instanceof MapPropertySource target) {
        map.entrySet().stream()
            .filter(e -> !(target.containsProperty(e.getKey())))
            .forEach(e -> target.getSource().put(e.getKey(), e.getValue()));
      }
    } else {
      propertySources.addLast(new MapPropertySource(DEFAULT_PROPERTIES_SOURCE_NAME, map));
    }
  }
}
