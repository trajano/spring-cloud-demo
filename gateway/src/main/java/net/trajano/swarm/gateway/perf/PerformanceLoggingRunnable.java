package net.trajano.swarm.gateway.perf;

import brave.Tracing;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.ExcludedPathPatterns;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;

@RequiredArgsConstructor
@Slf4j(topic = "request")
public class PerformanceLoggingRunnable implements Runnable {
  private static final String LOG_MESSAGE_FORMAT = "{} {} {} {}ms";

  private final ExcludedPathPatterns excludedPathPatterns;

  private final ServerWebExchange exchange;

  private final long startNanos;

  private final Tracing tracing;

  @Override
  public void run() {
    if (excludedPathPatterns.isExcludedForServer(
        exchange.getRequest().getPath().pathWithinApplication())) {
      return;
    }

    final String requestURI = exchange.getRequest().getURI().toASCIIString();
    final String method = exchange.getRequest().getMethodValue();

    final long requestTimeNano = System.nanoTime() - startNanos;
    final double requestTimeInMillis = requestTimeNano * 0.000001;
    final HttpStatus statusCode = Objects.requireNonNull(exchange.getResponse().getStatusCode());
    final int status = statusCode.value();
    final String requestTimeInMillisText = String.format("%.03f", requestTimeInMillis);
    if (requestTimeInMillis > 5000) {
      log.error(LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
    } else if (statusCode.is4xxClientError() || requestTimeInMillis > 3000) {
      log.warn(LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
    } else if (statusCode.isError()) {
      log.error(LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
    } else {
      log.info(LOG_MESSAGE_FORMAT, method, requestURI, status, requestTimeInMillisText);
    }
  }
}
