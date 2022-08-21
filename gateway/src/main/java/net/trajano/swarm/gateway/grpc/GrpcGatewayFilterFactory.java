package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR;
import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR;

import com.google.protobuf.Descriptors;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import lombok.Data;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;

@Component
public class GrpcGatewayFilterFactory
    extends AbstractGatewayFilterFactory<GrpcGatewayFilterFactory.Config> {

  public GrpcGatewayFilterFactory() {

    super(Config.class);
  }

  @Override
  public GatewayFilter apply(Config config) {

    return (exchange, chain) -> {
      if (!config.isUseGrpc()) {
        return chain.filter(exchange);
      }

      if (exchange.getRequest().getMethod() != HttpMethod.POST) {

        exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "forward");
        exchange
            .getAttributes()
            .put(GATEWAY_REQUEST_URL_ATTR, URI.create("forward:///methodNotAllowed"));
        return chain.filter(exchange);
      }
      final var pathElements =
          exchange.getRequest().getPath().elements().stream()
              .filter(e -> !(e instanceof PathContainer.Separator))
              .map(PathContainer.Element::value)
              .toArray(String[]::new);

      if (pathElements.length != 2) {
        // why doesn't this work?
        exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "forward");
        exchange
            .getAttributes()
            .put(GATEWAY_REQUEST_URL_ATTR, URI.create("forward:///clientError"));
        return chain.filter(exchange);
      }

      if (false) {
        return GrpcFunctions.managedChannel(config.getHost(), 50000, false)
            .map(ServerReflectionGrpc::newStub)
            .flatMapMany(GrpcFunctions::fileDescriptors)
            // cache() but it should be based on a source that would provide it.
            .map(
                fileDescriptorProto -> {
                  try {
                    return Descriptors.FileDescriptor.buildFrom(
                        fileDescriptorProto, new Descriptors.FileDescriptor[0]);
                  } catch (Descriptors.DescriptorValidationException e) {
                    throw new RuntimeException(e);
                  }
                })
            .flatMap(fileDescriptor -> Flux.fromIterable(fileDescriptor.getServices()))
            .filter(serviceDescriptor -> pathElements[0].equals(serviceDescriptor.getName()))
            .flatMap(serviceDescriptor -> Flux.fromIterable(serviceDescriptor.getMethods()))
            .filter(methodDescriptor -> pathElements[1].equals(methodDescriptor.getName()))
            .map(GrpcFunctions::methodDescriptorFromProtobuf)
            .last()
            .flatMap(
                fl -> {
                  ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.OK);
                  ServerWebExchangeUtils.setAlreadyRouted(exchange);

                  byte[] bytes =
                      ("MONOt stub" + config + " " + fl).getBytes(StandardCharsets.UTF_8);
                  var buffer = exchange.getResponse().bufferFactory().wrap(bytes);
                  return exchange.getResponse().writeWith(Flux.just(buffer));
                });
      }

      final var uri =
          UriComponentsBuilder.newInstance()
              .scheme("grpc")
              .host(config.getHost())
              .port(config.getPort())
              .pathSegment(pathElements)
              .build()
              .toUri();
      //      System.out.println(uri);
      //      exchange.getAttributes().put(GATEWAY_REQUEST_URL_ATTR, uri);

      exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR, "grpc");
      //      exchange.getAttributes().put("FFFOOOO", "forward");
      //      exchange.getAttributes().put(GATEWAY_REQUEST_URL_ATTR, URI.create("forward:/debug"));
      // ServerWebExchangeUtils.setAlreadyRouted();
      System.out.println("FACTORY:" + exchange.getAttributes());
      return chain.filter(exchange);
    };
  }

  /** Configuration. */
  @Data
  public static final class Config {

    private boolean useGrpc = false;

    private String host;

    private int port;
  }
}
