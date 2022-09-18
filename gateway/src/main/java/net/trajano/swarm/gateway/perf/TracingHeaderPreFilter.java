package net.trajano.swarm.gateway.perf;

import brave.Tracing;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.discovery.Util;
import org.springframework.cloud.sleuth.instrument.web.TraceWebFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class TracingHeaderPreFilter implements WebFilter, Ordered {

  private final Tracing tracing;

  private final TraceWebFilter traceWebFilter;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

    final String traceId = tracing.currentTraceContext().get().traceIdString();
    exchange.getResponse().getHeaders().add("X-B3-Traceid", traceId);
    exchange.getResponse().getHeaders().add("X-Trace-ID", Util.toXRay(traceId));
    exchange.getResponse().getHeaders().add("X-Amzn-Trace-Id", Util.toXRay(traceId));

    return chain.filter(exchange);
  }

  @Override
  public int getOrder() {

    return traceWebFilter.getOrder() + 1;
  }
}
