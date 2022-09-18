package net.trajano.swarm.gateway.perf;

import brave.Tracing;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.ExcludedPathPatterns;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.ReactiveLoadBalancerClientFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This adds the trace ID to the response and tracks how long it takes to perform the request. This
 * will exclude actuator and ping requests.
 */
@Component
@Slf4j(topic = "request")
@RequiredArgsConstructor
public class PerformanceRequestIDGlobalFilter implements GlobalFilter, Ordered {

  private final Tracing tracing;
  private final ExcludedPathPatterns excludedPathPatterns;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    final long startNanos = System.nanoTime();
    //    exchange.getAttributes().put(ServerWebExchange.LOG_ID_ATTRIBUTE, Util.toXRay(traceId));
    return chain
        .filter(exchange)
        .then(
            Mono.fromRunnable(
                new PerformanceLoggingRunnable(
                    excludedPathPatterns, exchange, startNanos, tracing)));
  }

  @Override
  public int getOrder() {

    return ReactiveLoadBalancerClientFilter.LOAD_BALANCER_CLIENT_FILTER_ORDER - 1;
  }
}
