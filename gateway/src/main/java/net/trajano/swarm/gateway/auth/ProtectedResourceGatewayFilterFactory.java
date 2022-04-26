package net.trajano.swarm.gateway.auth;

import com.google.common.net.HttpHeaders;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.ResolvableType;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Checks if the service is protected, signified by `protected` metadata not being present or
 * `true`. Checks for the presence of a bearer token and validates it. Once validated it places the
 * X-JWT-Assertion data containing the JWT stored.
 *
 * <p>This will provide the necessary error responses as expected by <a
 * href="https://www.rfc-editor.org/rfc/rfc6750">RFC 6750</a>.
 */
@Component
@Slf4j
public class ProtectedResourceGatewayFilterFactory<A, R extends OAuthTokenResponse, P>
    extends AbstractGatewayFilterFactory<ProtectedResourceGatewayFilterFactory.Config> {

  private final ReactiveDiscoveryClient discoveryClient;

  private final AuthService<A, R, P> authService;

  public ProtectedResourceGatewayFilterFactory(
      ReactiveDiscoveryClient discoveryClient, AuthService<A, R, P> authService) {

    super(Config.class);
    this.discoveryClient = discoveryClient;
    this.authService = authService;
  }

  /**
   * @param config
   * @return
   */
  @Override
  public GatewayFilter apply(final Config config) {

    return (exchange, chain) ->
        discoveryClient
            .getInstances(config.getServiceId())
            .next()
            .map(ServiceInstance::getMetadata)
            .map(metadata -> Boolean.parseBoolean(metadata.getOrDefault("protected", "true")))
            .filter(serviceProtected -> serviceProtected)
            .flatMap(
                serviceProtected -> {
                  if (!serviceProtected) {
                    log.trace("service not protected");
                    return chain.filter(exchange);
                  } else {
                    log.debug("service protected");

                    final String authorization =
                        exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                    if (authorization == null || !authorization.startsWith("Bearer ")) {
                      log.trace("No Bearer token in authorization");

                      ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.UNAUTHORIZED);
                      ServerWebExchangeUtils.setAlreadyRouted(exchange);
                      return chain
                          .filter(exchange)
                          .then(respondWithUnauthorized(config, exchange, null));
                    } else {

                      final String bearerToken = authorization.substring("Bearer ".length());
return                         authService.getClaims(bearerToken)
        .flatMap(jwtClaims->{
            return chain.filter(
                    authService.mutateDownstreamRequest(exchange, jwtClaims));
        })
                                .onErrorContinue((a,berr) -> {
            ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.UNAUTHORIZED);
            ServerWebExchangeUtils.setAlreadyRouted(exchange);
             chain
                    .filter(exchange)
                    .then(respondWithUnauthorized(config, exchange, "invalid_token"));

        });
//                      try {
//                        JwtClaims jwtClaims = authService.getClaims(bearerToken);
//                        return chain.filter(
//                            authService.mutateDownstreamRequest(exchange, jwtClaims));
//
//                      } catch (SecurityException e) {
//                        ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.UNAUTHORIZED);
//                        ServerWebExchangeUtils.setAlreadyRouted(exchange);
//                        return chain
//                            .filter(exchange)
//                            .then(respondWithUnauthorized(config, exchange, "invalid_token"));
//                      }
                    }
                  }
                });
  }

  private Mono<Void> respondWithUnauthorized(
      Config config, ServerWebExchange exchange, String error) {

    return Mono.defer(
        () -> {
          final var response = exchange.getResponse();
          if (error != null) {
            response
                .getHeaders()
                .add(
                    HttpHeaders.WWW_AUTHENTICATE,
                    "Bearer realm=\"%s\", error=\"%s\"".formatted(config.getRealm(), error));
          } else {
            response
                .getHeaders()
                .add(
                    HttpHeaders.WWW_AUTHENTICATE,
                    "Bearer realm=\"%s\"".formatted(config.getRealm()));
          }
          response
              .getHeaders()
              .add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON.toString());
          return response.writeWith(
              new Jackson2JsonEncoder()
                  .encode(
                      Mono.fromSupplier(UnauthorizedGatewayResponse::new),
                      response.bufferFactory(),
                      ResolvableType.forClass(UnauthorizedGatewayResponse.class),
                      MediaType.APPLICATION_JSON,
                      Hints.from(Hints.LOG_PREFIX_HINT, exchange.getLogPrefix())));
        });
  }

  /** Configuration. */
  @Data
  public static final class Config {

    private String serviceId;

    private String realm = "JWT";
  }
}
