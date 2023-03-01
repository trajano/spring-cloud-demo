package net.trajano.swarm.gateway.web;

import java.time.Duration;
import java.util.Set;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.Nullable;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.*;
import org.springframework.web.cors.reactive.DefaultCorsProcessor;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;

@Configuration
@Slf4j
// @EnableWebFlux
// @Data
// public class CorsConfigurer implements WebFluxConfigurer {
public class CorsConfigurer {

  @Getter
  @Value("${cors.allowed-headers:authorization,content-type,cache-control,x-requested-with}")
  private Set<String> allowedHeaders;

  @Getter
  @Value("${cors.allowed-methods:HEAD,GET,POST,DELETE,PATCH}")
  private Set<String> allowedMethods;

  @Getter
  @Value("${cors.allowed-origins:*}")
  private Set<String> allowedOrigins;
  //    @Value("${cors.allowed-headers:authorization,content-type}") private String[]
  // allowedHeaders;
  //
  //    @Value("${cors.allowed-methods:GET,POST,DELETE,PATCH}") private String[] allowedMethods;
  //
  //    @Value("${cors.allowed-origins:*}") private String[] allowedOrigins;

  //  public void addCorsMappings(CorsRegistry registry) {
  //
  //    registry
  //        .addMapping("/**")
  //        .allowedOrigins(allowedOrigins)
  //        .allowCredentials(false)
  //        .allowedHeaders(allowedHeaders)
  //        .allowedMethods(allowedMethods)
  //        .maxAge(86400);
  //  }

  @Bean
  CorsProcessor corsProcessor() {

    return new DefaultCorsProcessor();
  }

  static class OP extends DefaultCorsProcessor {

    @Override
    public boolean process(@Nullable CorsConfiguration config, ServerWebExchange exchange) {

      log.error(
          "uri={}, hasOrigin={} isCorsRequest={} isSameOrigin={} isPreflight={}",
          exchange.getRequest().getURI(),
          exchange.getRequest().getHeaders().containsKey(HttpHeaders.ORIGIN),
          CorsUtils.isCorsRequest(exchange.getRequest()),
          CorsUtils.isSameOrigin(exchange.getRequest()),
          CorsUtils.isPreFlightRequest(exchange.getRequest()));
      return super.process(config, exchange);
    }

    @Override
    protected boolean handleInternal(
        ServerWebExchange exchange, CorsConfiguration config, boolean preFlightRequest) {
      log.error("{}, {}, {}", config.getAllowedOrigins(), exchange, preFlightRequest);

      return super.handleInternal(exchange, config, preFlightRequest);
    }
  }

  @Bean
  CorsWebFilter corsWebFilter(CorsProcessor corsProcessor) {
    var corsConfiguration = new CorsConfiguration();
    allowedOrigins.forEach(corsConfiguration::addAllowedOrigin);
    allowedHeaders.forEach(corsConfiguration::addAllowedHeader);
    allowedMethods.forEach(corsConfiguration::addAllowedMethod);
    corsConfiguration.setAllowCredentials(false);
    corsConfiguration.setMaxAge(Duration.ofDays(1));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", corsConfiguration);

    return new CorsWebFilter(source, corsProcessor);
  }
}
