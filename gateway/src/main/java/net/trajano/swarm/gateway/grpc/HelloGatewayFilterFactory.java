package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR;

import lombok.Data;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

@Component
public class HelloGatewayFilterFactory
    extends AbstractGatewayFilterFactory<HelloGatewayFilterFactory.Config> {

  public HelloGatewayFilterFactory() {

    super(Config.class);
  }

  @Override
  public GatewayFilter apply(Config config) {

    return (exchange, chain) -> {
      if (!config.isUseHello()) {
        return chain.filter(exchange);
      }
      //
      //      if (exchange.getRequest().getMethod() != HttpMethod.POST) {
      //
      //        exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "forward");
      //        exchange
      //            .getAttributes()
      //            .put(GATEWAY_REQUEST_URL_ATTR, URI.create("forward:///methodNotAllowed"));
      //        return chain.filter(exchange);
      //      }
      //      final var pathElements =
      //          exchange.getRequest().getPath().elements().stream()
      //              .filter(e -> !(e instanceof PathContainer.Separator))
      //              .map(PathContainer.Element::value)
      //              .toArray(String[]::new);
      //
      //      if (pathElements.length != 2) {
      //        // why doesn't this work?
      //        exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "forward");
      //        exchange
      //            .getAttributes()
      //            .put(GATEWAY_REQUEST_URL_ATTR, URI.create("forward:///clientError"));
      //        return chain.filter(exchange);
      //      }
      //
      exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "hello");
      return chain.filter(exchange);
    };
  }

  /** Configuration. */
  @Data
  public static final class Config {

    private boolean useHello = false;

    private String host;

    private int port;
  }
}
