package net.trajano.swarm.gateway.web;

import brave.Span;
import brave.Tracer;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.discovery.Util;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This adds the request ID to the header and the MDC on the exchange. In addition, it tracks the
 * performance of the request.
 */
@Component
@Slf4j(topic = "request")
public class PerformanceRequestIDPostFilter implements GlobalFilter {

  private final Tracer tracer;

  private static final String LOG_MESSAGE_FORMAT = "[{}] {} {} {} {}ms";

  public PerformanceRequestIDPostFilter(Tracer tracer) {

    this.tracer = tracer;
  }

  @Override
  public Mono<Void> filter(final ServerWebExchange exchange, GatewayFilterChain chain) {

    Span span = tracer.currentSpan();
    if (span != null) {
      String traceId = span.context().traceIdString();
      exchange.getResponse().getHeaders().add("X-B3-Traceid", traceId);
      exchange.getResponse().getHeaders().add("X-Trace-ID", Util.toXRay(traceId));
    }
    final long startNanos = System.nanoTime();
    return chain
        .filter(exchange)
        .then(
            Mono.fromRunnable(
                () -> {
                  final String requestURI = exchange.getRequest().getURI().toASCIIString();
                  final String method = exchange.getRequest().getMethodValue();

                  final String traceId = "";

                  final long requestTimeNano = System.nanoTime() - startNanos;
                  final double requestTimeInMillis = requestTimeNano * 0.000001;
                  final HttpStatus statusCode =
                      Objects.requireNonNull(exchange.getResponse().getStatusCode());
                  final int status = statusCode.value();
                  final String requestTimeInMillisText =
                      String.format("%.03f", requestTimeInMillis);
                  if (statusCode.is4xxClientError()) {
                    log.warn(
                        LOG_MESSAGE_FORMAT,
                        traceId,
                        method,
                        requestURI,
                        status,
                        requestTimeInMillisText);
                  } else if (statusCode.isError()) {
                    log.error(
                        LOG_MESSAGE_FORMAT,
                        traceId,
                        method,
                        requestURI,
                        status,
                        requestTimeInMillisText);
                  } else {
                    log.info(
                        LOG_MESSAGE_FORMAT,
                        traceId,
                        method,
                        requestURI,
                        status,
                        requestTimeInMillisText);
                  }
                  final HttpHeaders responseHeaders = exchange.getResponse().getHeaders();
                  if (responseHeaders.getAccessControlAllowOrigin() == null) {
                    responseHeaders.setAccessControlAllowOrigin("*");
                  }
                  responseHeaders.computeIfAbsent(
                      "X-Trace-ID", key -> List.of(Util.toXRay(MDC.get("traceId"))));
                }));
  }
}
