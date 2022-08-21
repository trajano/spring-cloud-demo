package net.trajano.swarm.gateway.web;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class OrderedGlobalFilter implements Ordered, GlobalFilter {

  private final GlobalFilter delegate;

  private final int order;

  public OrderedGlobalFilter(GlobalFilter delegate, int order) {

    this.delegate = delegate;
    this.order = order;
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    System.out.println("DELEGATE:" + exchange.getAttributes());

    return delegate.filter(exchange, chain);
  }

  @Override
  public int getOrder() {

    return order;
  }
}
