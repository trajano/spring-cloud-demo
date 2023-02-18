package net.trajano.swarm.gateway.auth;

import static reactor.core.publisher.Mono.fromCallable;

import io.micrometer.core.instrument.Counter;
import java.time.Duration;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeoutException;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import net.trajano.swarm.gateway.auth.clientmanagement.ClientManagementService;
import net.trajano.swarm.gateway.auth.clientmanagement.InvalidClientException;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.InvalidClientGatewayResponse;
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
import reactor.util.context.Context;

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
 * @param <P> profile type (maybe removed later)
 */
@Slf4j
public abstract class AbstractAuthController<A, P> {

  @Autowired private AuthProperties authProperties;

  @Autowired private Scheduler authenticationScheduler;

  @Autowired private ClaimsService claimsService;

  @Autowired private ClientManagementService clientManagementService;

  /** */
  @Autowired private IdentityService<A, P> identityService;

  @Autowired private JwksProvider jwksProvider;

  @Autowired private Scheduler jwksScheduler;

  @Autowired private Scheduler logoutScheduler;

  @Autowired
  @Qualifier("penalty") private Scheduler penaltyScheduler;

  @Autowired private Scheduler refreshTokenScheduler;

  @Autowired private Counter successfulAuthenticationRequests;

  private void addCommonHeaders(ServerHttpResponse serverHttpResponse) {

    serverHttpResponse.getHeaders().add(HttpHeaders.CACHE_CONTROL, "no-cache");
  }

  private Mono<GatewayResponse> addDelaySpecifiedInServiceResponse(
      AuthServiceResponse<GatewayResponse> serviceResponse) {

    return fromCallable(serviceResponse::getOperationResponse)
        .delayElement(serviceResponse.getDelay(), penaltyScheduler);
  }

  /**
   * Provide a function to apply a minimum operation time
   *
   * @param i input type ignored
   * @return a mono that is delayed until a target time.
   * @param <T> input type that is ignored
   */
  private <T> Mono<?> applyMinimumOperationTime(T i) {

    return Mono.deferContextual(
            ctx ->
                Mono.just(
                    authProperties.getMinimumOperationTimeInMillis()
                        + (long) ctx.get("startTime")
                        - System.currentTimeMillis()))
        .filter(delayTime -> delayTime > 0)
        .map(Duration::ofMillis)
        .flatMap(delayTime -> Mono.just(i).delayElement(delayTime));
  }

  @CrossOrigin
  @PostMapping(
      path = "${auth.controller-mappings.authentication:/auth}",
      consumes = {MediaType.APPLICATION_JSON_VALUE},
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<GatewayResponse> authenticate(
      @RequestBody Mono<A> authenticationRequestMono, ServerWebExchange serverWebExchange) {

    return validateClient(serverWebExchange)
        .transformDeferredContextual(
            (clientId, context) ->
                clientId.doOnNext(
                    next -> context.get(AuthenticationContext.class).setClientId(next)))
        .then(authenticationRequestMono)
        .flatMap(
            authenticationRequest ->
                identityService.authenticate(
                    authenticationRequest, serverWebExchange.getRequest().getHeaders()))
        .filter(IdentityServiceResponse::isOk)
        .transformDeferredContextual(
            (identityServiceResponseMono, context) ->
                identityServiceResponseMono.flatMap(
                    identityServiceResponse ->
                        claimsService.storeAndSignIdentityServiceResponse(
                            identityServiceResponse,
                            null,
                            context.get(AuthenticationContext.class).getClientId())))
        .timeout(Duration.ofMillis(authProperties.getAuthenticationProcessingTimeoutInMillis()))
        .doOnNext(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              addCommonHeaders(serverHttpResponse);
              serverHttpResponse.setStatusCode(HttpStatus.OK);
            })
        .doOnNext(
            serviceResponse -> {
              successfulAuthenticationRequests.increment();
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
            InvalidClientException.class,
            ex -> respondWithInvalidClientCredentials(serverWebExchange))
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
        .delayUntil(this::applyMinimumOperationTime)
        .contextWrite(this::writeStartTimeToContext)
        .contextWrite(this::writeAuthenticationContext)
        .subscribeOn(authenticationScheduler);
  }

  private Context writeAuthenticationContext(Context context) {
    return context.put(AuthenticationContext.class, new AuthenticationContext());
  }

  private Mono<? extends GatewayResponse> respondWithInvalidClientCredentials(
      ServerWebExchange serverWebExchange) {

    return Mono.just(new InvalidClientGatewayResponse())
        .doOnNext(
            response -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              serverHttpResponse.setStatusCode(HttpStatus.UNAUTHORIZED);
              serverHttpResponse
                  .getHeaders()
                  .add(
                      HttpHeaders.WWW_AUTHENTICATE,
                      "Basic realm=\"%s\"".formatted(authProperties.getRealm()));
            })
        .delayElement(
            Duration.ofMillis(authProperties.getPenaltyDelayInMillis()), penaltyScheduler);
  }

  private Mono<String> validateClient(ServerWebExchange serverWebExchange) {
    return clientManagementService.obtainClientIdFromServerExchange(serverWebExchange);
  }

  @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "Bad request")
  @ExceptionHandler(IllegalArgumentException.class)
  public Mono<GatewayResponse> illegalArgumentExceptionHandler() {

    return Mono.just(GatewayResponse.builder().ok(false).error("client_error").build());
  }

  @CrossOrigin
  @GetMapping(
      path = "${auth.controller-mappings.jwks:/jwks}",
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<String> jwks() {

    return jwksProvider.jsonWebKeySet().map(JsonWebKeySet::toJson).subscribeOn(jwksScheduler);
  }

  /**
   * Performs the logout operation. This will always return a successful response.
   *
   * @param request request
   * @param serverWebExchange server web exchange
   * @return gateway response which should always be ok.
   */
  @CrossOrigin
  @PostMapping(
      path = "${auth.controller-mappings.logout:/logout}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<GatewayResponse> logout(
      @ModelAttribute OAuthRevocationRequest request, ServerWebExchange serverWebExchange) {

    if (!request.getToken_type_hint().equals("refresh_token")
        || !StringUtils.hasText(request.getToken())) {
      return Mono.error(new IllegalArgumentException());
    }

    final var logoutFromService =
        validateClient(serverWebExchange)
            .flatMap(
                clientId ->
                    claimsService.revoke(
                        request.getToken(), serverWebExchange.getRequest().getHeaders(), clientId))
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
            .delayUntil(this::applyMinimumOperationTime);

    final var timeout =
        Mono.just(GatewayResponse.builder().ok(true).build())
            .delayElement(Duration.ofMillis(authProperties.getRevokeProcessingTimeoutInMillis()));

    return validateClient(serverWebExchange)
        .then(
            Mono.firstWithValue(logoutFromService, timeout)
                .onErrorResume(
                    InvalidClientException.class,
                    ex -> respondWithInvalidClientCredentials(serverWebExchange))
                .contextWrite(this::writeStartTimeToContext));
  }

  @CrossOrigin
  @PostMapping(
      path = "${auth.controller-mappings.refresh:/refresh}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<GatewayResponse> refreshUrlEncoded(
      @ModelAttribute OAuthRefreshRequest oAuthRefreshRequest,
      ServerWebExchange serverWebExchange) {

    if (!"refresh_token".equals(oAuthRefreshRequest.getGrant_type())) {
      log.trace("{}", oAuthRefreshRequest);
      return Mono.error(new IllegalArgumentException());
    }

    return validateClient(serverWebExchange)
        .flatMap(
            clientId ->
                claimsService.refresh(
                    oAuthRefreshRequest.getRefresh_token(),
                    serverWebExchange.getRequest().getHeaders(),
                    clientId))
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
            InvalidClientException.class,
            ex -> respondWithInvalidClientCredentials(serverWebExchange))
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
        .delayUntil(this::applyMinimumOperationTime)
        .contextWrite(this::writeStartTimeToContext)
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

  private Context writeStartTimeToContext(Context ctx) {
    return ctx.put("startTime", System.currentTimeMillis());
  }
}
