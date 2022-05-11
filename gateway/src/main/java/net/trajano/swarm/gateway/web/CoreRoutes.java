package net.trajano.swarm.gateway.web;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.*;

@Configuration
@SuppressWarnings("unused")
public class CoreRoutes {

  @Value("${gateway.root-html-redirect-uri:#{null}}")
  private URI rootHtmlRedirectUri;

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
  RouterFunction<ServerResponse> openapiJson(@Value("file:///openapi.json") Resource body) {

    return route(
        gethead("/openapi.json"),
        request -> ServerResponse.ok().contentType(MediaType.APPLICATION_JSON).bodyValue(body));
  }

  @Bean
  RouterFunction<ServerResponse> ping() {

    return route(
        gethead("/ping"),
        request ->
            ServerResponse.ok()
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

  static RequestPredicate gethead(String pathPattern) {
    return methods(HttpMethod.GET, HttpMethod.HEAD).and(path(pathPattern));
  }
}
