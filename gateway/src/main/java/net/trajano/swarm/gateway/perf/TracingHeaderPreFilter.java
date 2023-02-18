package net.trajano.swarm.gateway.perf;

import static org.springframework.web.filter.reactive.ServerHttpObservationFilter.CURRENT_OBSERVATION_CONTEXT_ATTRIBUTE;

import io.micrometer.tracing.handler.TracingObservationHandler;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.discovery.Util;
import org.springframework.cloud.gateway.filter.ReactiveLoadBalancerClientFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.observation.ServerRequestObservationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class TracingHeaderPreFilter implements WebFilter, Ordered {

  private final ReactiveLoadBalancerClientFilter reactiveLoadBalancerClientFilter;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

    final ServerRequestObservationContext attribute =
        exchange.getRequiredAttribute(CURRENT_OBSERVATION_CONTEXT_ATTRIBUTE);

    Optional.<TracingObservationHandler.TracingContext>ofNullable(
            attribute.get(TracingObservationHandler.TracingContext.class))
        .map(TracingObservationHandler.TracingContext::getSpan)
        .ifPresent(
            span -> {
              final var traceId = span.context().traceId();
              exchange.getResponse().getHeaders().add("X-B3-Traceid", traceId);
              exchange.getResponse().getHeaders().add("X-Trace-ID", Util.toXRay(traceId));
              exchange.getResponse().getHeaders().add("X-Amzn-Trace-Id", Util.toXRay(traceId));
            });

    return chain.filter(exchange);
  }

  @Override
  public int getOrder() {

    return reactiveLoadBalancerClientFilter.getOrder() + 1;
  }
}
