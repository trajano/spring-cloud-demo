package net.trajano.swarm.gateway.web;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RequestPredicate;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
@SuppressWarnings("unused")
public class CoreRoutes {

    private final CorsConfigurer corsConfigurer;

  @Value("${gateway.root-html-redirect-uri:#{null}}") private URI rootHtmlRedirectUri;

  private static Set<String> getRequestedHeaders(ServerRequest.Headers headers) {

    return Arrays.stream(
            headers.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS).get(0).split(","))
        .map(String::trim)
        .map(String::toLowerCase)
        .collect(Collectors.toSet());
  }

  static RequestPredicate gethead(String pathPattern) {
    return methods(HttpMethod.GET, HttpMethod.HEAD).and(path(pathPattern));
  }

  private boolean allowedHeadersAgainstRequestHeadersIsAllowed(ServerRequest.Headers headers) {
    if (corsConfigurer.getAllowedHeaders().contains("*")) {
      return true;
    }
    final var requestedHeaders = getRequestedHeaders(headers);
    return corsConfigurer.getAllowedHeaders().containsAll(requestedHeaders);
  }

  private boolean allowedMethodsAgainstRequestMethodIsAllowed(ServerRequest.Headers headers) {
    return corsConfigurer.getAllowedMethods().contains(
        headers.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD).get(0));
  }

  private boolean allowedOriginAgainstRequestOrigin(ServerRequest.Headers headers) {
    return corsConfigurer.getAllowedOrigins().contains(headers.header(HttpHeaders.ORIGIN).get(0))
        || corsConfigurer.getAllowedOrigins().contains("*");
  }

  @Bean
  RouterFunction<ServerResponse> clientError() {

    return route(
        path("/clientError"),
        request ->
            ServerResponse.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(GatewayResponse.builder().error("client_error").ok(false).build()));
  }

  RouterFunction<ServerResponse> corsRequest() {
    return route(
        methods(HttpMethod.OPTIONS)
            .and(headers(h -> h.header(HttpHeaders.ORIGIN).size() == 1))
            .and(headers(h -> h.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD).size() == 1))
            .and(headers(h -> h.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS).size() == 1)),
        request -> {
          final var headers = request.headers();

          if (!allowedOriginAgainstRequestOrigin(headers)
              || !allowedHeadersAgainstRequestHeadersIsAllowed(headers)
              || !allowedMethodsAgainstRequestMethodIsAllowed(headers)) {
            return ServerResponse.status(HttpStatus.FORBIDDEN).build();
          }

          final String allowOrigin;
          if (corsConfigurer.getAllowedOrigins().contains("*")) {
            allowOrigin = "*";
          } else {
            allowOrigin = headers.header(HttpHeaders.ORIGIN).get(0);
          }
          final Set<String> allowHeaders;
          if (corsConfigurer.getAllowedHeaders().contains("*")) {
            allowHeaders = Set.of("*");
          } else {
            allowHeaders = getRequestedHeaders(headers);
          }
          return ServerResponse.noContent()
              .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowOrigin)
              .header(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, String.join(",", corsConfigurer.getAllowedMethods()))
              .header(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, String.join(",", allowHeaders))
              .header(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "false")
              .header(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "86400")
              .build();
        });
  }

  @Bean
  RouterFunction<ServerResponse> htmlRedirect() {
    return route(
        gethead("/").and(accept(MediaType.TEXT_HTML)),
        request -> {
          if (rootHtmlRedirectUri == null) {
            return ServerResponse.noContent().build();
          } else {
            return ServerResponse.temporaryRedirect(rootHtmlRedirectUri).build();
          }
        });
  }

  @Bean
  RouterFunction<ServerResponse> methodNotAllowed() {

    return route(
        path("/methodNotAllowed").and(request -> "forward".equals(request.uri().getScheme())),
        request ->
            ServerResponse.status(HttpStatus.METHOD_NOT_ALLOWED)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    GatewayResponse.builder().error("method_not_allowed").ok(false).build()));
  }

  @Bean
  RouterFunction<ServerResponse> openapiJson(@Value("file:///openapi.json") Resource body) {

    return route(
        gethead("/openapi.json"),
        request -> ServerResponse.ok().contentType(MediaType.APPLICATION_JSON).bodyValue(body));
  }

  /**
   * Returns an OK response.
   *
   * <p>The CORS headers are explicitly set because the <a
   * href="https://developer.mozilla.org/en-US/docs/Web/API/fetch">fetch API</a> requires CORS
   * headers in the response unless {@code mode: "no-cors"} is set.
   *
   * @see <a
   *     href="https://github.com/react-native-netinfo/react-native-netinfo/issues/632">react-native-netinfo#632</a>
   * @return ping route
   */
  @Bean
  RouterFunction<ServerResponse> ping() {

    return route(
        gethead("/ping"),
        request ->
            ServerResponse.ok()
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET,HEAD")
                .header(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "86400")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(GatewayResponse.builder().ok(true).build()));
  }

  @Bean
  RouterFunction<ServerResponse> unavailable() {

    return route(
        path("/unavailable"),
        request ->
            ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    GatewayResponse.builder().error("service_unavailable").ok(false).build()));
  }
}
