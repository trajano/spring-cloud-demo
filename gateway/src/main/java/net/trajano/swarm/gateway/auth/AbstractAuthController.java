package net.trajano.swarm.gateway.auth;

import static reactor.core.publisher.Mono.fromCallable;

import java.time.Duration;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeoutException;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

/**
 * Due to type erasure, this was made abstract so a concrete implementation like
 * SimpleAuthController can be used where the types are fully passed in. Use autowired so subclasses
 * do not have to form the constructor.
 *
 * <p>Security logging is not performed here, see {@link ClaimsService} implementation for these
 * logs.
 *
 * <p>Resilience4J TimeLimiter is not used instead {@link Mono#timeout(Duration)} is used.
 *
 * @param <A> authentication request
 * @param <P> profile type (may be removed later)
 */
@Slf4j
public abstract class AbstractAuthController<A, P> {

  @Autowired private AuthProperties authProperties;

  @Autowired private Scheduler authenticationScheduler;

  @Autowired private ClaimsService claimsService;

  /** */
  @Autowired private IdentityService<A, P> identityService;

  @Autowired private JwksProvider jwksProvider;

  @Autowired private Scheduler jwksScheduler;

  @Autowired private Scheduler logoutScheduler;

  @Autowired
  @Qualifier("penalty") private Scheduler penaltyScheduler;

  @Autowired private Scheduler refreshTokenScheduler;

  private void addCommonHeaders(ServerHttpResponse serverHttpResponse) {

    serverHttpResponse.getHeaders().add(HttpHeaders.CACHE_CONTROL, "no-cache");
  }

  private Mono<GatewayResponse> addDelaySpecifiedInServiceResponse(
      AuthServiceResponse<GatewayResponse> serviceResponse) {

    return fromCallable(serviceResponse::getOperationResponse)
        .delayElement(serviceResponse.getDelay(), penaltyScheduler);
  }

  @PostMapping(
      path = "${auth.controller-mappings.authentication:/auth}",
      consumes = {MediaType.APPLICATION_JSON_VALUE},
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<GatewayResponse> authenticate(
      @RequestBody Mono<A> authenticationRequestMono, ServerWebExchange serverWebExchange) {

    return authenticationRequestMono
        .flatMap(
            authenticationRequest ->
                identityService.authenticate(
                    authenticationRequest, serverWebExchange.getRequest().getHeaders()))
        .filter(IdentityServiceResponse::isOk)
        .flatMap(
            identityServiceResponse ->
                claimsService.storeAndSignIdentityServiceResponse(identityServiceResponse, null))
        .timeout(Duration.ofMillis(authProperties.getAuthenticationProcessingTimeoutInMillis()))
        .doOnNext(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              addCommonHeaders(serverHttpResponse);
              serverHttpResponse.setStatusCode(HttpStatus.OK);
            })
        .switchIfEmpty(
            Mono.just(GatewayResponse.builder().ok(false).error("invalid_credentials").build())
                .doOnNext(
                    response -> {
                      final var serverHttpResponse = serverWebExchange.getResponse();
                      serverHttpResponse.setStatusCode(HttpStatus.UNAUTHORIZED);
                      serverHttpResponse
                          .getHeaders()
                          .add(
                              HttpHeaders.WWW_AUTHENTICATE,
                              "Bearer realm=\"%s\"".formatted(authProperties.getRealm()));
                    })
                .delayElement(
                    Duration.ofMillis(authProperties.getPenaltyDelayInMillis()), penaltyScheduler))
        .onErrorResume(
            SecurityException.class,
            ex ->
                Mono.just(GatewayResponse.builder().ok(false).error("invalid_credentials").build())
                    .doOnNext(
                        response -> {
                          final var serverHttpResponse = serverWebExchange.getResponse();
                          serverHttpResponse.setStatusCode(HttpStatus.UNAUTHORIZED);
                          serverHttpResponse
                              .getHeaders()
                              .add(
                                  HttpHeaders.WWW_AUTHENTICATE,
                                  "Bearer realm=\"%s\"".formatted(authProperties.getRealm()));
                        })
                    .delayElement(
                        Duration.ofMillis(authProperties.getPenaltyDelayInMillis()),
                        penaltyScheduler))
        .onErrorResume(
            RejectedExecutionException.class,
            ex1 ->
                respondWithServiceUnavailable(
                    serverWebExchange, "Rejected execution for authentication request"))
        .onErrorResume(
            TimeoutException.class,
            ex1 ->
                respondWithServiceUnavailable(
                    serverWebExchange, "Timed out processing authentication request"))
        .subscribeOn(authenticationScheduler);
  }

  @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "Bad request")
  @ExceptionHandler(IllegalArgumentException.class)
  public Mono<GatewayResponse> illegalArgumentExceptionHandler() {

    return Mono.just(GatewayResponse.builder().ok(false).error("client_error").build());
  }

  @GetMapping(
      path = "${auth.controller-mappings.jwks:/jwks}",
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<String> jwks() {

    return jwksProvider.jsonWebKeySet().map(JsonWebKeySet::toJson).subscribeOn(jwksScheduler);
  }

  @PostMapping(
      path = "${auth.controller-mappings.logout:/logout}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<GatewayResponse> logout(
      @ModelAttribute OAuthRevocationRequest request, ServerWebExchange serverWebExchange) {

    if (!request.getToken_type_hint().equals("refresh_token")
        || !StringUtils.hasText(request.getToken())) {
      throw new IllegalArgumentException();
    }

    return claimsService
        .revoke(request.getToken(), serverWebExchange.getRequest().getHeaders())
        .timeout(Duration.ofMillis(authProperties.getRevokeProcessingTimeoutInMillis()))
        .doOnNext(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              addCommonHeaders(serverHttpResponse);
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
            })
        .flatMap(this::addDelaySpecifiedInServiceResponse)
        // on security error just return ok and add penalty
        .onErrorResume(
            SecurityException.class,
            ex ->
                Mono.just(GatewayResponse.builder().ok(true).build())
                    .delayElement(
                        Duration.ofMillis(authProperties.getPenaltyDelayInMillis()),
                        penaltyScheduler))
        .onErrorResume(TimeoutException.class, ex1 -> respondWithOk(serverWebExchange))
        .subscribeOn(logoutScheduler);
  }

  @PostMapping(
      path = "${auth.controller-mappings.refresh:/refresh}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<GatewayResponse> refreshUrlEncoded(
      @ModelAttribute OAuthRefreshRequest oAuthRefreshRequest,
      ServerWebExchange serverWebExchange) {

    if (!oAuthRefreshRequest.getGrant_type().equals("refresh_token")) {
      return Mono.error(new IllegalArgumentException());
    }

    return claimsService
        .refresh(
            oAuthRefreshRequest.getRefresh_token(), serverWebExchange.getRequest().getHeaders())
        .timeout(Duration.ofMillis(authProperties.getRefreshProcessingTimeoutInMillis()))
        .doOnNext(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              addCommonHeaders(serverHttpResponse);
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
              if (serviceResponse.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                serverHttpResponse
                    .getHeaders()
                    .add(
                        HttpHeaders.WWW_AUTHENTICATE,
                        "Bearer realm=\"%s\", error=\"invalid_token\""
                            .formatted(authProperties.getRealm()));
              }
            })
        .flatMap(this::addDelaySpecifiedInServiceResponse)
        .onErrorResume(
            RejectedExecutionException.class,
            ex1 ->
                respondWithServiceUnavailable(
                    serverWebExchange, "Rejected execution for refresh request"))
        .onErrorResume(
            TimeoutException.class,
            ex1 ->
                respondWithServiceUnavailable(
                    serverWebExchange, "Timed out processing refresh request"))
        .subscribeOn(refreshTokenScheduler);
  }

  /**
   * Handle timeouts gracefully to the client when logging out. Returns an okay response.
   *
   * @param exchange web exchange
   * @return response mono
   */
  private Mono<GatewayResponse> respondWithOk(ServerWebExchange exchange) {
    log.warn("timed out performing logout request, silently returning OK to client");
    return Mono.just(GatewayResponse.builder().ok(true).build())
        .doOnNext(
            response -> {
              final var serverHttpResponse = exchange.getResponse();
              serverHttpResponse.setStatusCode(HttpStatus.OK);
            });
  }

  /**
   * Handle timeouts gracefully to the client.
   *
   * @param exchange web exchange
   * @param message message to log
   * @return response mono
   */
  private Mono<GatewayResponse> respondWithServiceUnavailable(
      ServerWebExchange exchange, String message) {
    log.warn(message);
    return Mono.just(GatewayResponse.builder().ok(false).error("service_unavailable").build())
        .doOnNext(
            response -> {
              final var serverHttpResponse = exchange.getResponse();
              serverHttpResponse.setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
              serverHttpResponse.getHeaders().add(HttpHeaders.RETRY_AFTER, "120");
            });
  }
}
