package net.trajano.swarm.gateway.grpc;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class DebugGlobalFilter2 implements GlobalFilter, Ordered {

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    System.out.println("LOWDEBUG:" + exchange.getAttributes());
    System.out.println(
        "LOWDEBUG:"
            + exchange.getRequiredAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR));
    return chain.filter(exchange);
  }

  @Override
  public int getOrder() {

    return Ordered.LOWEST_PRECEDENCE - 1;
  }
}
