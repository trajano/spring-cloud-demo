package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import com.google.protobuf.DynamicMessage;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.stub.ClientCalls;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.Response;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.NettyRoutingFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.PathContainer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** This is a global filter that routes Unary GRPC calls. */
@Component
@Slf4j
@RequiredArgsConstructor
public class UnaryGrpcGlobalFilter implements GlobalFilter, Ordered {

  private final ChannelProvider channelProvider;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    if (!isAccepted(exchange)) {
      return chain.filter(exchange);
    }

    final Response<ServiceInstance> r =
        exchange.getRequiredAttribute(GATEWAY_LOADBALANCER_RESPONSE_ATTR);

    final URI uri = exchange.getRequiredAttribute(GATEWAY_REQUEST_URL_ATTR);
    final var managedChannel = channelProvider.obtainFor(r.getServer());
    final var serverReflectionStub = ServerReflectionGrpc.newStub(managedChannel);

    // we are not caching because if the services get updated then we won't know
    // maybe add the reflection on the service itself since that will be recreated when
    // the service registers itself.
    final var methodDescriptorMono =
        GrpcFunctions.methodDescriptor(
            uri, GrpcFunctions.fileDescriptors(serverReflectionStub).map(GrpcFunctions::buildFrom));

    return Mono.zip(
            cacheRequestBody(
                exchange, serverHttpRequest -> DataBufferUtils.join(serverHttpRequest.getBody())),
            methodDescriptorMono)
        .flatMap(
            t -> {
              try (final var jsonReader = new InputStreamReader(t.getT1().asInputStream())) {

                var builder = DynamicMessage.newBuilder(t.getT2().getInputType());
                JsonFormat.parser().merge(jsonReader, builder);
                final var inputMessage = builder.build();

                final var grpcMethodDescriptor =
                    GrpcFunctions.methodDescriptorFromProtobuf(t.getT2());

                if (grpcMethodDescriptor.getType() != MethodDescriptor.MethodType.UNARY) {
                  return Mono.error(
                      () ->
                          new IllegalStateException(
                              "Expected Unary, but got %s for %s"
                                  .formatted(
                                      grpcMethodDescriptor.getType(),
                                      grpcMethodDescriptor.getFullMethodName())));
                }

                final var dynamicMessage =
                    ClientCalls.blockingUnaryCall(
                        managedChannel, grpcMethodDescriptor, CallOptions.DEFAULT, inputMessage);
                // at this point build the GRPC call?
                byte[] bytes =
                    JsonFormat.printer()
                        .omittingInsignificantWhitespace()
                        .print(dynamicMessage)
                        .getBytes(StandardCharsets.UTF_8);
                var buffer = exchange.getResponse().bufferFactory().wrap(bytes);
                return exchange.getResponse().writeWith(Flux.just(buffer));

              } catch (IOException e) {
                // Fix this later
                return Mono.error(e);
              }
            });
  }

  /** Same level as Netty filter */
  @Override
  public int getOrder() {

    return NettyRoutingFilter.ORDER;
  }

  /**
   * The exchange is accepted if all the following conditions hold true:
   *
   * <ul>
   *   <li>{@link
   *       org.springframework.cloud.gateway.support.ServerWebExchangeUtils#GATEWAY_SCHEME_PREFIX_ATTR}
   *       is {@code grpc}. That is set by the {@link GrpcGatewayFilterFactory}.
   *   <li>{@link ServerHttpRequest#getMethod()} is {@link HttpMethod#POST}
   *   <li>{@link ServerHttpRequest#getPath()} } contains exactly two non-separator segments
   *   <li>{@link HttpHeaders#getContentType()} is {@link MediaType#APPLICATION_JSON}
   *   <li>{@link HttpHeaders#getAccept()} contains {@link MediaType#APPLICATION_JSON}
   * </ul>
   *
   * @param exchange exchange
   * @return true if accepted
   */
  private boolean isAccepted(ServerWebExchange exchange) {

    System.out.println(exchange.getRequest());
    System.out.println(exchange.getRequest().getPath());
    System.out.println(exchange.getRequest().getCookies());
    System.out.println(exchange.getRequest().getMethod());
    System.out.println(exchange.getAttributes());
    if (log.isWarnEnabled()) {
      log.warn(
          "exchange.getRequiredAttribute(GATEWAY_SCHEME_PREFIX_ATTR)={}",
          (Object) exchange.getRequiredAttribute(GATEWAY_SCHEME_PREFIX_ATTR));
      log.warn("exchange.getRequest().getMethod()={}", exchange.getRequest().getMethod());
      log.warn("exchange.getRequest().getPath()={}", exchange.getRequest().getPath());
      log.warn(
          "toNormalizedPathSegments(exchange.getRequest().getPath()).length={}",
          toNormalizedPathSegments(exchange.getRequest().getPath()).length);
      log.warn(
          "exchange.getRequest().getHeaders().getContentType()={}",
          exchange.getRequest().getHeaders().getContentType());
      log.warn(
          "exchange.getRequest().getHeaders().getAccept()={}",
          exchange.getRequest().getHeaders().getAccept());
    }
    return ("grpc".equals(exchange.getRequiredAttribute(GATEWAY_SCHEME_PREFIX_ATTR)))
        && exchange.getRequest().getMethod() == HttpMethod.POST
        && toNormalizedPathSegments(exchange.getRequest().getPath()).length == 2
        && exchange.getRequest().getHeaders().getContentType() == MediaType.APPLICATION_JSON
        && exchange.getRequest().getHeaders().getAccept().contains(MediaType.APPLICATION_JSON);
  }

  private String[] toNormalizedPathSegments(PathContainer pathContainer) {
    return pathContainer.elements().stream()
        .filter(element -> !(element instanceof PathContainer.Separator))
        .map(PathContainer.Element::value)
        .toArray(String[]::new);
  }
}
