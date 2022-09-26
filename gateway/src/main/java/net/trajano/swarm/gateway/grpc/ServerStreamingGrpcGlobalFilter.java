package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.MethodDescriptor;
import io.grpc.StatusRuntimeException;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.stub.ClientCalls;
import io.grpc.stub.StreamObserver;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.SequenceInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
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
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

/** This is a global filter that routes Unary GRPC calls. */
@Component
@Slf4j
@RequiredArgsConstructor
public class ServerStreamingGrpcGlobalFilter implements GlobalFilter, Ordered {

  private final ChannelProvider channelProvider;
  private final Scheduler grpcScheduler;
  private final JsonFormat.Parser jsonParser = JsonFormat.parser();

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

  private Flux<DynamicMessage> assembleAndSendMessage(
      ServerWebExchange exchange,
      Channel managedChannel,
      DynamicMessage request,
      MethodDescriptor<DynamicMessage, DynamicMessage> grpcMethodDescriptor) {

    try {

      if (grpcMethodDescriptor.getType() != MethodDescriptor.MethodType.SERVER_STREAMING) {
        return Flux.error(
            () ->
                new IllegalStateException(
                    "Expected Streaming, but got %s for %s"
                        .formatted(
                            grpcMethodDescriptor.getType(),
                            grpcMethodDescriptor.getFullMethodName())));
      }

      final var callOptions =
          CallOptions.DEFAULT.withCallCredentials(
              new JwtCallCredentials(
                  ((JwtClaims) exchange.getRequiredAttribute("jwtClaims")).toJson()));

      return Flux.<DynamicMessage>create(
          emitter -> {
            final var call = managedChannel.newCall(grpcMethodDescriptor, callOptions);
            ClientCalls.asyncServerStreamingCall(
                call,
                request,
                new StreamObserver<>() {
                  @Override
                  public void onCompleted() {
                    emitter.complete();
                  }

                  @Override
                  public void onError(Throwable t) {
                    emitter.error(t);
                  }

                  @Override
                  public void onNext(DynamicMessage dynamicMessage) {
                    emitter.next(dynamicMessage);
                  }
                });
          });

    } catch (StatusRuntimeException e) {
      // Fix this later
      return Flux.error(e);
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
    final var managedChannel = channelProvider.obtainFor(r.getServer());
    final var serverReflectionStub = ServerReflectionGrpc.newStub(managedChannel);

    // we are not caching because if the services get updated then we won't know
    // maybe add the reflection on the service itself since that will be recreated when
    // the service registers itself.
    final var methodDescriptorMono =
        GrpcFunctions.methodDescriptor(
            uri, GrpcFunctions.fileDescriptors(serverReflectionStub).map(GrpcFunctions::buildFrom));

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

              var dataBufferStream =
                  assembleAndSendMessage(exchange, managedChannel, request, grpcMethodDescriptor)
                      // send headers on first successful value
                      .doFirst(
                          () ->
                              exchange
                                  .getResponse()
                                  .getHeaders()
                                  .add(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE))
                      .flatMap(
                          dynamicMessage -> {
                            try {
                              return Mono.just(
                                  JsonFormat.printer()
                                      .omittingInsignificantWhitespace()
                                      .print(dynamicMessage));
                            } catch (InvalidProtocolBufferException e) {
                              return Mono.error(e);
                            }
                          })
                      .map(json -> ServerSentEvent.builder(json).build())
                      .map(ServerSentEventFunctions::getString)
                      .map(s -> s.getBytes(StandardCharsets.UTF_8))
                      .map(bytes -> exchange.getResponse().bufferFactory().wrap(bytes))
                      .map(Flux::just);

              return exchange.getResponse().writeAndFlushWith(dataBufferStream);
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
        && exchange.getRequest().getHeaders().getAccept().contains(MediaType.TEXT_EVENT_STREAM);
  }
}
