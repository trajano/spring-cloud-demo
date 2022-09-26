package net.trajano.swarm.gateway.discovery.ratelimiter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.gateway.filter.factory.RequestRateLimiterGatewayFilterFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RateLimiter;
import org.springframework.stereotype.Component;

@Component
public class DiscoveryRequestRateLimiterGatewayFilterFactory
    extends RequestRateLimiterGatewayFilterFactory {

  public DiscoveryRequestRateLimiterGatewayFilterFactory(
      RateLimiter defaultRateLimiter,
      @Qualifier("tokenKeyResolver") KeyResolver defaultKeyResolver) {

    super(defaultRateLimiter, defaultKeyResolver);
  }
}
