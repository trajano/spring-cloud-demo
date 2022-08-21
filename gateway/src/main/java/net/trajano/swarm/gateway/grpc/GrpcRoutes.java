package net.trajano.swarm.gateway.grpc;

import static org.springframework.web.reactive.function.server.RequestPredicates.path;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

import net.trajano.swarm.gateway.web.GatewayResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class GrpcRoutes {

  @Bean
  RouterFunction<ServerResponse> grpcRoute() {
    return route(
        request -> request.uri().getScheme().equals("grpc"),
        request -> {
          System.out.println("GRPC" + request.attributes());
          return ServerResponse.status(HttpStatus.OK)
              .contentType(MediaType.APPLICATION_JSON)
              .bodyValue(
                  GatewayResponse.builder()
                      .error("grpc_call" + request.attributes())
                      .ok(false)
                      .build());
        });
  }

  @Bean
  RouterFunction<ServerResponse> debug() {

    return route(
        path("/debug"),
        request ->
            ServerResponse.status(HttpStatus.OK)
                .contentType(MediaType.TEXT_PLAIN)
                .bodyValue(request.attributes().toString()));
  }
}
