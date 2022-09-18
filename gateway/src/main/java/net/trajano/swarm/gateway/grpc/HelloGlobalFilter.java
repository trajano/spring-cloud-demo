package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.NettyRoutingFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/** This is a global filter that routes Unary GRPC calls. */
@Component
@Slf4j
@RequiredArgsConstructor
public class HelloGlobalFilter implements GlobalFilter, Ordered {

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    if (!isAccepted(exchange)) {
      return chain.filter(exchange);
    }

    ServerWebExchangeUtils.setAlreadyRouted(exchange);

    final var exchangeResponse = exchange.getResponse();
    var buffer = exchangeResponse.bufferFactory().wrap("hello".getBytes(StandardCharsets.UTF_8));
    exchangeResponse.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);

    return exchangeResponse.writeWith(Mono.just(buffer)).then(chain.filter(exchange));
  }

  /** Same level as Netty filter */
  @Override
  public int getOrder() {

    return NettyRoutingFilter.ORDER;
  }

  /**
   * The exchange is accepted if all the following conditions hold true:
   *
   * <ul>
   *   <li>{@link ServerWebExchangeUtils#GATEWAY_SCHEME_PREFIX_ATTR} is {@code grpc}. That is set by
   *       the {@link GrpcGatewayFilterFactory}.
   *   <li>{@link ServerHttpRequest#getMethod()} is {@link HttpMethod#POST}
   *   <li>{@link ServerHttpRequest#getPath()} } contains exactly two non-separator segments
   *   <li>{@link HttpHeaders#getContentType()} is {@link MediaType#APPLICATION_JSON}
   *   <li>{@link HttpHeaders#getAccept()} contains {@link MediaType#APPLICATION_JSON}
   * </ul>
   *
   * @param exchange exchange
   * @return true if accepted
   */
  private boolean isAccepted(ServerWebExchange exchange) {
    return ("hello".equals(exchange.getAttribute(GATEWAY_SCHEME_PREFIX_ATTR)));
  }
}
