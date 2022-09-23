package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.stub.ClientCalls;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.SequenceInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.WeakHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jose4j.jwt.JwtClaims;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.Response;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.NettyRoutingFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.PooledDataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

/** This is a global filter that routes Unary GRPC calls. */
@Component
@Slf4j
@RequiredArgsConstructor
public class UnaryGrpcGlobalFilter implements GlobalFilter, Ordered {

  private final ChannelProvider channelProvider;
  private final Scheduler grpcScheduler;
  private final JsonFormat.Parser jsonParser = JsonFormat.parser();

  private record MethodDescriptorCacheKey(String serviceInstanceId, URI uri) {}
  /** Method descriptor cache. */
  private final Map<MethodDescriptorCacheKey, Mono<Descriptors.MethodDescriptor>>
      methodDescriptorCache = new WeakHashMap<>();

  private final JsonFormat.Printer jsonPrinter =
      JsonFormat.printer().omittingInsignificantWhitespace();

  private Mono<DynamicMessage> assembleRequest(
      final InputStream inputStream, final Descriptors.MethodDescriptor methodDescriptor) {
    try (final var jsonReader = new InputStreamReader(inputStream)) {
      var builder = DynamicMessage.newBuilder(methodDescriptor.getInputType());
      jsonParser.merge(jsonReader, builder);
      return Mono.just(builder.build());
    } catch (IOException e) {
      // Fix this later
      return Mono.error(e);
    }
  }

  private Mono<DynamicMessage> assembleAndSendMessage(
      ServerWebExchange exchange,
      Channel managedChannel,
      DynamicMessage request,
      MethodDescriptor<DynamicMessage, DynamicMessage> grpcMethodDescriptor) {

    try {

      if (grpcMethodDescriptor.getType() != MethodDescriptor.MethodType.UNARY) {
        return Mono.error(
            () ->
                new IllegalStateException(
                    "Expected Unary, but got %s for %s"
                        .formatted(
                            grpcMethodDescriptor.getType(),
                            grpcMethodDescriptor.getFullMethodName())));
      }

      final var callOptions =
          CallOptions.DEFAULT.withCallCredentials(
              new JwtCallCredentials(
                  ((JwtClaims) exchange.getRequiredAttribute("jwtClaims")).toJson()));

      final var call = managedChannel.newCall(grpcMethodDescriptor, callOptions);

      final var dynamicMessage = ClientCalls.blockingUnaryCall(call, request);
      // at this point build the GRPC call?
      return Mono.just(dynamicMessage);
    } catch (StatusRuntimeException e) {
      // Fix this later
      return Mono.error(e);
    }
  }

  private Mono<byte[]> dynamicMessageToBytes(DynamicMessage dynamicMessage) {
    try {
      return Mono.just(jsonPrinter.print(dynamicMessage).getBytes(StandardCharsets.UTF_8));
    } catch (IOException e) {
      return Mono.error(e);
    }
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    if (!isAccepted(exchange)) {
      return chain.filter(exchange);
    }

    ServerWebExchangeUtils.setAlreadyRouted(exchange);

    final Response<ServiceInstance> r =
        exchange.getRequiredAttribute(GATEWAY_LOADBALANCER_RESPONSE_ATTR);

    final URI uri = exchange.getRequiredAttribute(GATEWAY_REQUEST_URL_ATTR);
    final String serviceInstanceId = r.getServer().getInstanceId();
    final var managedChannel = channelProvider.obtainFor(r.getServer());

    // use the uri to obtain the method descriptor rather than doing reflection.
    final var methodDescriptorMono =
        methodDescriptorCache.computeIfAbsent(
            new MethodDescriptorCacheKey(serviceInstanceId, uri),
            key -> {
              final var serverReflectionStub = ServerReflectionGrpc.newStub(managedChannel);

              return GrpcFunctions.methodDescriptor(
                      key.uri(),
                      GrpcFunctions.fileDescriptors(serverReflectionStub)
                          .map(GrpcFunctions::buildFrom))
                  .cache();
            });

    // Request input stream, note that this needs to be closed at the end.
    final var requestInputStreamMono =
        exchange
            .getRequest()
            .getBody()
            .map(dataBuffer -> dataBuffer.asInputStream(true))
            .reduce(SequenceInputStream::new)
            .doOnDiscard(
                SequenceInputStream.class,
                sequenceInputStream -> {
                  try {
                    sequenceInputStream.close();
                  } catch (IOException e) {
                    // no-op
                  }
                })
            .doOnDiscard(PooledDataBuffer.class, DataBufferUtils::release);

    return chain
        .filter(exchange)
        .then(Mono.zip(requestInputStreamMono, methodDescriptorMono))
        .flatMap(
            t -> {
              final var inputStream = t.getT1();
              final var methodDescriptor = t.getT2();
              return Mono.zip(
                  assembleRequest(inputStream, methodDescriptor),
                  Mono.just(GrpcFunctions.methodDescriptorFromProtobuf(methodDescriptor)));
            })
        .flatMap(
            t -> {
              final var request = t.getT1();
              final var grpcMethodDescriptor = t.getT2();

              return assembleAndSendMessage(
                  exchange, managedChannel, request, grpcMethodDescriptor);
            })
        .flatMap(this::dynamicMessageToBytes)
        .flatMap(
            messageBytes -> {
              final var exchangeResponse = exchange.getResponse();
              var buffer = exchangeResponse.bufferFactory().wrap(messageBytes);
              exchangeResponse
                  .getHeaders()
                  .add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
              exchangeResponse
                  .getHeaders()
                  .add(HttpHeaders.CONTENT_LENGTH, String.valueOf(messageBytes.length));

              return exchangeResponse.writeWith(Mono.just(buffer));
            })
        .subscribeOn(grpcScheduler);
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
    return ("grpc".equals(exchange.getAttribute(GATEWAY_SCHEME_PREFIX_ATTR)))
        && exchange.getRequest().getMethod() == HttpMethod.POST
        && ((URI) exchange.getRequiredAttribute(GATEWAY_REQUEST_URL_ATTR))
            .getPath()
            .matches("/\\w+/\\w+")
        && MediaType.APPLICATION_JSON.equals(exchange.getRequest().getHeaders().getContentType())
        && exchange.getRequest().getHeaders().getAccept().contains(MediaType.APPLICATION_JSON);
  }
}
