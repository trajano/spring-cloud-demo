package net.trajano.swarm.gateway.auth;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
public class AuthController<A, R extends GatewayResponse, P> {

  private final AuthService<A, R, P> authService;

  @RequestMapping(
      path = "${auth.controller-mappings.username-password-authentication:/auth}",
      method = RequestMethod.POST)
  public Mono<R> authenticate(
      A authenticationRequest,
      @RequestHeader Map<String, String> headers,
      ServerHttpResponse serverHttpResponse) {

    final var authenticationResponse = authService.authenticate(authenticationRequest, headers);
    serverHttpResponse.setStatusCode(authenticationResponse.getStatusCode());
    return Mono.just(authenticationResponse.getOperationResponse())
        .delayElement(authenticationResponse.getDelay());
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
    final var refreshResponse =
        authService.refresh(oAuthRefreshRequest.getRefresh_token(), headers);
    serverHttpResponse.setStatusCode(refreshResponse.getStatusCode());
    return Mono.just(refreshResponse.getOperationResponse())
        .delayElement(refreshResponse.getDelay());
  }

  @RequestMapping(
      path = "${auth.controller-mappings.logout:/logout}",
      method = RequestMethod.POST,
      consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public Mono<Void> logout(
      @ModelAttribute OAuthRevocationRequest oAuthRefreshRequest,
      @RequestHeader Map<String, String> headers,
      ServerHttpResponse serverHttpResponse) {

    if (!oAuthRefreshRequest.getToken_type_hint().equals("refresh_token")) {
      throw new IllegalArgumentException();
    }
    final var serviceResponse = authService.revoke(oAuthRefreshRequest.getToken(), headers);
    serverHttpResponse.setStatusCode(serviceResponse.getStatusCode());
    return Mono.empty().then().delayElement(serviceResponse.getDelay());
  }

  @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "Bad request")
  @ExceptionHandler(IllegalArgumentException.class)
  public Mono<GatewayResponse> illegalArgumentExceptionHandler() {

    return Mono.just(GatewayResponse.builder().ok(false).error("client_error").build());
  }
}
