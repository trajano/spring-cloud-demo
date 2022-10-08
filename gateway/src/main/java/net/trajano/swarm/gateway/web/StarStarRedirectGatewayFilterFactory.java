package net.trajano.swarm.gateway.web;

import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * This filter will handle redirecting requests that do not have a trailing slash to add the
 * trailing slash to the end of the request if it matches the path without the trailing slash.
 */
@Component
@Slf4j
public class StarStarRedirectGatewayFilterFactory
    extends AbstractGatewayFilterFactory<StarStarRedirectGatewayFilterFactory.Config> {

  public StarStarRedirectGatewayFilterFactory() {

    super(Config.class);
  }

  @Override
  public GatewayFilter apply(Config config) {

    return (exchange, chain) -> {
      if (config.isPathEndsWithSlashStarStar()
          && (config.isActive())
          && config.getPathWithoutStars().equals(exchange.getRequest().getPath().value())) {
        exchange.getResponse().setStatusCode(HttpStatus.PERMANENT_REDIRECT);
        exchange
            .getResponse()
            .getHeaders()
            .setLocation(URI.create(exchange.getRequest().getURI() + "/"));
        ServerWebExchangeUtils.setAlreadyRouted(exchange);
      }
      return chain.filter(exchange);
    };
  }

  public record Config(String path, Boolean active) {

    public boolean isActive() {

      return active == null || Boolean.TRUE.equals(active);
    }

    public boolean isPathEndsWithSlashStarStar() {

      return path.endsWith("/**");
    }

    public String getPathWithoutStars() {

      return path.substring(0, path.length() - 3);
    }
  }
}
