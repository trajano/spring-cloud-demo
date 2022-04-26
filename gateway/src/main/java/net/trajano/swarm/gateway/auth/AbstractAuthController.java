package net.trajano.swarm.gateway.auth;

import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Due to type erasure, this was made abstract so a concrete implementation like SimpleAuthController can be used 
 * where the types are fully passed in.
 * @param <A>
 * @param <R>
 * @param <P>
 */
@RequiredArgsConstructor
public abstract class AbstractAuthController<A, R extends GatewayResponse, P> {

  private final AuthService<A, R, P>
      authService;

  @PostMapping(
      path = "${auth.controller-mappings.username-password-authentication:/auth}",
      consumes = {MediaType.APPLICATION_JSON_VALUE},
      produces = {MediaType.APPLICATION_JSON_VALUE})
  public Mono<R> authenticate(
          @RequestBody Mono<A> authenticationRequest,
          ServerWebExchange serverWebExchange) {
    return authService
        .authenticate(authenticationRequest, serverWebExchange.getRequest().getHeaders())
        .doOnNext(
            serviceResponse ->
                serverWebExchange.getResponse().setStatusCode(serviceResponse.getStatusCode()))
        .flatMap(
            serviceResponse ->
                Mono.fromCallable(serviceResponse::getOperationResponse)
                    .delayElement(serviceResponse.getDelay()));
  }

  @RequestMapping(
      path = "${auth.controller-mappings.refresh:/refresh}",
      method = RequestMethod.POST,
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public Mono<R> refreshUrlEncoded(
      @ModelAttribute OAuthRefreshRequest oAuthRefreshRequest,
      @RequestHeader Map<String, String> headers,
      ServerHttpResponse serverHttpResponse) {

    if (!oAuthRefreshRequest.getGrant_type().equals("refresh_token")) {
      throw new IllegalArgumentException();
    }
    return authService
        .refresh(oAuthRefreshRequest.getRefresh_token(), headers)
        .map(
            serviceResponse -> {
              serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
              return serviceResponse.getOperationResponse();
            });
  }

  @RequestMapping(
      path = "${auth.controller-mappings.logout:/logout}",
      method = RequestMethod.POST,
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public Mono<R> logout(
      @ModelAttribute OAuthRevocationRequest oAuthRefreshRequest,
      @RequestHeader Map<String, String> headers,
      ServerHttpResponse serverHttpResponse) {

    if (!oAuthRefreshRequest.getToken_type_hint().equals("refresh_token")) {
      return Mono.error(new IllegalArgumentException());
    }
    return authService
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
