package net.trajano.swarm.gateway.web;

import brave.Tracing;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.discovery.Util;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.sleuth.instrument.web.WebFluxSleuthOperators;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This adds the trace ID to the response and tracks how long it takes to perform the request on
 * gateway.
 */
@Component
@RequiredArgsConstructor
@Slf4j(topic = "request")
public class PerformanceRequestIDPostGatewayFilter implements GlobalFilter {

  private final Tracing tracing;

  private static final String LOG_MESSAGE_FORMAT = "{} {} {} {}ms";

  @Override
  public Mono<Void> filter(final ServerWebExchange exchange, GatewayFilterChain chain) {

    final long startNanos = System.nanoTime();
    return chain
        .filter(exchange)
        .doOnEach(
            WebFluxSleuthOperators.withSpanInScope(
                () -> {
                  final String traceId = tracing.currentTraceContext().get().traceIdString();
                  exchange.getResponse().getHeaders().add("X-B3-Traceid", traceId);
                  exchange.getResponse().getHeaders().add("X-Trace-ID", Util.toXRay(traceId));
                }))
        .then(
            Mono.fromRunnable(
                () -> {
                  final String requestURI = exchange.getRequest().getURI().toASCIIString();
                  final String method = exchange.getRequest().getMethodValue();

                  final long requestTimeNano = System.nanoTime() - startNanos;
                  final double requestTimeInMillis = requestTimeNano * 0.000001;
                  final HttpStatus statusCode =
                      Objects.requireNonNull(exchange.getResponse().getStatusCode());
                  final int status = statusCode.value();
                  final String requestTimeInMillisText =
                      String.format("%.03f", requestTimeInMillis);
                  if (requestTimeInMillis > 5000) {
                    log.error(
                        LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
                  } else if (statusCode.is4xxClientError() || requestTimeInMillis > 3000) {
                    log.warn(
                        LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
                  } else if (statusCode.isError()) {
                    log.error(
                        LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
                  } else {
                    log.info(
                        LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
                  }
                  //                  // add CORS
                  //                  final HttpHeaders responseHeaders =
                  // exchange.getResponse().getHeaders();
                  //                  if (responseHeaders.getAccessControlAllowOrigin() == null) {
                  //                    responseHeaders.setAccessControlAllowOrigin("*");
                  //                  }
                }));
  }
}
