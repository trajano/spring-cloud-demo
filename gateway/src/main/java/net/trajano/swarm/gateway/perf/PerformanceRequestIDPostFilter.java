package net.trajano.swarm.gateway.perf;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.ExcludedPathPatterns;
import net.trajano.swarm.gateway.discovery.Util;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.cloud.sleuth.Span;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * This adds the trace ID to the response and tracks how long it takes to perform the request. This
 * will exclude actuator and ping requests.
 */
@Component
@Slf4j(topic = "request")
@RequiredArgsConstructor
public class PerformanceRequestIDPostFilter implements WebFilter {

  private final ExcludedPathPatterns excludedPathPatterns;

  @Override
  public Mono<Void> filter(final ServerWebExchange exchange, final WebFilterChain chain) {

    final Span span = exchange.getRequiredAttribute(Span.class.getName());
    exchange
        .getAttributes()
        .put(ServerWebExchange.LOG_ID_ATTRIBUTE, Util.toXRay(span.context().traceId()));
    // If it was routed by gateway don't bother, Gateway has its own Global filter
    if (ServerWebExchangeUtils.isAlreadyRouted(exchange)) {
      return chain.filter(exchange);
    }
    final long startNanos = System.nanoTime();
    return chain
        .filter(exchange)
        .then(
            Mono.fromRunnable(
                new PerformanceLoggingRunnable(excludedPathPatterns, exchange, startNanos)));
  }
}
