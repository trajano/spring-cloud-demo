package net.trajano.swarm.gateway.discovery.ratelimiter;

import net.trajano.swarm.gateway.ServerWebExchangeAttributes;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfiguration {

  /**
   * Obtains the JWT ID from the token. For now it will compute it, but if the value is available
   * earlier say from {@link net.trajano.swarm.gateway.auth.ProtectedResourceGatewayFilterFactory}
   * then this will take it from an attribute
   *
   * @return key resolver
   */
  @Bean
  KeyResolver tokenKeyResolver() {
    return exchange ->
        Mono.justOrEmpty((JwtClaims) exchange.getAttribute(ServerWebExchangeAttributes.JWT_CLAIMS))
            .flatMap(
                jwtClaims -> {
                  try {
                    return Mono.just(jwtClaims.getJwtId());
                  } catch (MalformedClaimException e) {
                    return Mono.error(e);
                  }
                });
  }
}
