package net.trajano.swarm.gateway.auth;

import static reactor.core.publisher.Mono.fromCallable;

import java.util.Map;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Due to type erasure, this was made abstract so a concrete implementation like
 * SimpleAuthController can be used where the types are fully passed in. Use autowired so subclasses
 * do not have to form the constructor.
 *
 * @param <A>
 * @param <R>
 * @param <P>
 */
public abstract class AbstractAuthController<A, R extends GatewayResponse, P> {

  /** */
  @Autowired private IdentityService<A, R, P> identityService;

  @Autowired private AuthProperties authProperties;

  @PostMapping(
      path = "${auth.controller-mappings.username-password-authentication:/auth}",
      consumes = {MediaType.APPLICATION_JSON_VALUE},
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<R> authenticate(
      @RequestBody Mono<A> authenticationRequestMono, ServerWebExchange serverWebExchange) {
    return identityService
        .authenticate(authenticationRequestMono, serverWebExchange.getRequest().getHeaders())
        .doOnNext(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
              if (serviceResponse.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                serverHttpResponse
                    .getHeaders()
                    .add(
                        HttpHeaders.WWW_AUTHENTICATE,
                        "Bearer realm=\"%s\"".formatted(authProperties));
              }
            })
        .flatMap(
            serviceResponse ->
                fromCallable(serviceResponse::getOperationResponse)
                    .delayElement(serviceResponse.getDelay()));
  }

  @GetMapping(
      path = "${auth.controller-mappings.jwks:/jwks}",
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<String> jwks() {
    return identityService.jsonWebKeySet().map(JsonWebKeySet::toJson);
  }

  @PostMapping(
      path = "${auth.controller-mappings.refresh:/refresh}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<R> refreshUrlEncoded(
      @ModelAttribute OAuthRefreshRequest oAuthRefreshRequest,
      ServerWebExchange serverWebExchange) {

    if (!oAuthRefreshRequest.getGrant_type().equals("refresh_token")) {
      throw new IllegalArgumentException();
    }

    return identityService
        .refresh(
            oAuthRefreshRequest.getRefresh_token(), serverWebExchange.getRequest().getHeaders())
        .map(
            serviceResponse -> {
              final var serverHttpResponse = serverWebExchange.getResponse();
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
              if (serviceResponse.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                serverHttpResponse
                    .getHeaders()
                    .add(
                        HttpHeaders.WWW_AUTHENTICATE,
                        "Bearer realm=\"%s\"".formatted(authProperties));
              }
              return serviceResponse.getOperationResponse();
            });
  }

  @PostMapping(
      path = "${auth.controller-mappings.logout:/logout}",
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public Mono<R> logout(
      @ModelAttribute OAuthRevocationRequest oAuthRefreshRequest,
      @RequestHeader Map<String, String> headers,
      ServerHttpResponse serverHttpResponse) {

    if (!oAuthRefreshRequest.getToken_type_hint().equals("refresh_token")) {
      return Mono.error(new IllegalArgumentException());
    }
    return identityService
        .revoke(oAuthRefreshRequest.getToken(), headers)
        .map(
            serviceResponse -> {
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
              return serviceResponse.getOperationResponse();
            });
  }

  @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "Bad request")
  @ExceptionHandler(IllegalArgumentException.class)
  public Mono<GatewayResponse> illegalArgumentExceptionHandler() {

    return Mono.just(GatewayResponse.builder().ok(false).error("client_error").build());
  }
}