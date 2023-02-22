package net.trajano.swarm.gateway.auth;

import static net.trajano.swarm.gateway.ServerWebExchangeAttributes.JWT_CLAIMS;

import com.google.common.net.HttpHeaders;
import io.micrometer.core.instrument.Counter;
import java.time.Duration;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.springframework.beans.factory.annotation.Qualifier;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * Checks if the service is protected, signified by `protected` metadata not being present or
 * `true`. Checks for the presence of a bearer token and validates it.
 *
 * <p>This will provide the necessary error responses as expected by <a
 * href="https://www.rfc-editor.org/rfc/rfc6750">RFC 6750</a>.
 */
@Component
@Slf4j
public class ProtectedResourceGatewayFilterFactory
    extends AbstractGatewayFilterFactory<ProtectedResourceGatewayFilterFactory.Config> {

  private final ReactiveDiscoveryClient discoveryClient;

  private final Scheduler penaltyScheduler;

  private final Scheduler protectedResourceScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "protected-resource");

  private final IdentityService<?, ?> identityService;

  private final AuthProperties authProperties;

  private final ClaimsService claimsService;

  private final Counter succeededApiRequests;

  public ProtectedResourceGatewayFilterFactory(
      ReactiveDiscoveryClient discoveryClient,
      AuthProperties authProperties,
      ClaimsService claimsService,
      IdentityService<?, ?> identityService,
      Counter succeededApiRequests,
      @Qualifier("penalty") Scheduler penaltyScheduler) {

    super(Config.class);
    this.discoveryClient = discoveryClient;
    this.authProperties = authProperties;
    this.claimsService = claimsService;
    this.identityService = identityService;
    this.succeededApiRequests = succeededApiRequests;
    this.penaltyScheduler = penaltyScheduler;
  }

  /**
   * At this point clientId is expected to be set in the exchange
   *
   * @param config filter factory configuration
   * @return filter
   */
  @Override
  public GatewayFilter apply(final Config config) {

    return (exchange, chain) ->
        discoveryClient
            .getInstances(config.getServiceId())
            .next()
            .map(ServiceInstance::getMetadata)
            .map(metadata -> Boolean.parseBoolean(metadata.getOrDefault("protected", "true")))
            .flatMap(
                serviceProtected -> {
                  if (!serviceProtected) {
                    log.trace("service not protected");
                    return chain.filter(exchange);
                  } else {
                    log.trace("service protected");

                    final String authorization =
                        exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                    if (authorization == null || !authorization.startsWith("Bearer ")) {
                      log.trace("No Bearer token in authorization");

                      ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.UNAUTHORIZED);
                      ServerWebExchangeUtils.setAlreadyRouted(exchange);
                      return respondWithUnauthorized(config, exchange, "missing_token", null);
                    } else {

                      final String bearerToken = authorization.substring("Bearer ".length());
                      return claimsService
                          .getClaims(bearerToken)
                          .flatMap(
                              jwtClaims -> {
                                exchange.getAttributes().put(JWT_CLAIMS, jwtClaims);
                                return chain.filter(
                                    identityService.mutateDownstreamRequest(exchange, jwtClaims));
                              })
                          .doOnNext(
                              a -> {
                                succeededApiRequests.increment();
                              })
                          .onErrorResume(
                              SecurityException.class,
                              ex -> {
                                ServerWebExchangeUtils.setResponseStatus(
                                    exchange, HttpStatus.UNAUTHORIZED);
                                ServerWebExchangeUtils.setAlreadyRouted(exchange);
                                log.debug(
                                    "SecurityException obtaining claims: {}", ex.getMessage(), ex);
                                return respondWithUnauthorized(
                                        config, exchange, "invalid_token", ex.getMessage())
                                    .delayElement(
                                        Duration.ofMillis(authProperties.getPenaltyDelayInMillis()),
                                        penaltyScheduler);
                              })
                          .onErrorResume(
                              ex -> !(ex instanceof ResponseStatusException),
                              ex -> {
                                ServerWebExchangeUtils.setResponseStatus(
                                    exchange, HttpStatus.UNAUTHORIZED);
                                ServerWebExchangeUtils.setAlreadyRouted(exchange);
                                log.warn(
                                    "{} when obtaining claims: {}",
                                    ex.getClass(),
                                    ex.getMessage(),
                                    ex);
                                return respondWithUnauthorized(
                                    config, exchange, "invalid_token", ex.getMessage());
                              });
                    }
                  }
                })
            .subscribeOn(protectedResourceScheduler);
  }

  private Mono<Void> respondWithUnauthorized(
      Config config, ServerWebExchange exchange, String error, String errorDescription) {

    return Mono.defer(
        () -> {
          final var response = exchange.getResponse();
          response.setStatusCode(HttpStatus.UNAUTHORIZED);
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
                      Mono.fromSupplier(() -> new GatewayResponse(false, error, errorDescription)),
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
