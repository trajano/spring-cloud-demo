package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import com.google.protobuf.DynamicMessage;
import com.google.protobuf.util.JsonFormat;
import io.grpc.CallOptions;
import io.grpc.MethodDescriptor;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.stub.ClientCalls;
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
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
  private final JsonFormat.Parser parser = JsonFormat.parser();

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
            .reduce(SequenceInputStream::new);

    final var bodyMono = DataBufferUtils.join(exchange.getRequest().getBody());
    if (false) {
      try (var pos = new PipedOutputStream();
          var pis = new PipedInputStream(pos); ) {
        return DataBufferUtils.write(exchange.getRequest().getBody().log("BODY"), pos)
            .log("AAAA")
            .doOnNext(DataBufferUtils::release)
            .then(
                exchange
                    .getResponse()
                    .writeWith(
                        Mono.just(
                            exchange
                                .getResponse()
                                .bufferFactory()
                                .wrap(("Hel" + pis + " l2o").getBytes(StandardCharsets.UTF_8)))))
            .then(chain.filter(exchange));

      } catch (IOException e) {
        return Mono.error(e);
      }
    }
    if (false) {
      return requestInputStreamMono
          .doOnNext(
              inputStream -> {
                try {
                  inputStream.close();
                } catch (IOException e) {
                  throw new RuntimeException(e);
                }
              })
          .then(
              exchange
                  .getResponse()
                  .writeWith(
                      Mono.just(
                          exchange
                              .getResponse()
                              .bufferFactory()
                              .wrap("Hell2o".getBytes(StandardCharsets.UTF_8)))))
          .then(chain.filter(exchange));
    }

    if (false) {
      return exchange
          .getRequest()
          .getBody()
          .log("BODYxx", Level.SEVERE)
          .doOnNext(
              bodydMono -> {
                try {
                  System.out.println(bodydMono);
                  System.out.println(bodydMono.asByteBuffer());
                  System.out.println(bodydMono.asByteBuffer().array().length);
                  System.out.println(
                      new String(bodydMono.asByteBuffer().array(), StandardCharsets.UTF_8));
                } catch (Throwable x) {
                  x.printStackTrace();
                } finally {
                  System.out.println(DataBufferUtils.release(bodydMono));
                }
              })
          .then(
              exchange
                  .getResponse()
                  .writeWith(
                      Mono.just(
                          exchange
                              .getResponse()
                              .bufferFactory()
                              .wrap("Hell2o".getBytes(StandardCharsets.UTF_8)))))
          .then(chain.filter(exchange));
    }

    if (false) {
      return exchange
          .getRequest()
          .getBody()
          .log("BODY", Level.SEVERE)
          .doOnNext(DataBufferUtils::release)
          .then(
              exchange
                  .getResponse()
                  .writeWith(
                      Mono.just(
                          exchange
                              .getResponse()
                              .bufferFactory()
                              .wrap("Hell2o".getBytes(StandardCharsets.UTF_8)))))
          .then(chain.filter(exchange));
    }
    if (false) {
      return bodyMono
          .flatMap(
              buffer ->
                  exchange
                      .getResponse()
                      .writeWith(
                          Mono.just(
                              exchange
                                  .getResponse()
                                  .bufferFactory()
                                  .wrap("Hello".getBytes(StandardCharsets.UTF_8)))))
          .then(chain.filter(exchange));
    }

    if (true) {
      return Mono.zip(requestInputStreamMono, methodDescriptorMono)
          .flatMap(
              t -> {
                try (final var jsonReader = new InputStreamReader(t.getT1())) {

                  var builder = DynamicMessage.newBuilder(t.getT2().getInputType());
                  parser.merge(jsonReader, builder);
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

                  final var callOptions =
                      CallOptions.DEFAULT.withCallCredentials(
                          new JwtCallCredentials(
                              ((JwtClaims) exchange.getRequiredAttribute("jwtClaims")).toJson()));

                  final var call = managedChannel.newCall(grpcMethodDescriptor, callOptions);

                  final var dynamicMessage = ClientCalls.blockingUnaryCall(call, inputMessage);
                  // at this point build the GRPC call?
                  final byte[] bytes =
                      JsonFormat.printer()
                          .omittingInsignificantWhitespace()
                          .print(dynamicMessage)
                          .getBytes(StandardCharsets.UTF_8);
                  final var exchangeResponse = exchange.getResponse();
                  var buffer = exchangeResponse.bufferFactory().wrap(bytes);
                  exchangeResponse
                      .getHeaders()
                      .add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                  exchangeResponse
                      .getHeaders()
                      .add(HttpHeaders.CONTENT_LENGTH, String.valueOf(bytes.length));

                  return exchangeResponse.writeWith(Mono.just(buffer)).then(chain.filter(exchange));

                } catch (IOException e) {
                  // Fix this later
                  return Mono.error(e);
                }
              })
          .subscribeOn(grpcScheduler);
    }

    return Mono.zip(bodyMono, methodDescriptorMono)
        .flatMap(
            t -> {
              try (final var jsonReader = new InputStreamReader(t.getT1().asInputStream(true))) {

                var builder = DynamicMessage.newBuilder(t.getT2().getInputType());
                parser.merge(jsonReader, builder);
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

                final var callOptions =
                    CallOptions.DEFAULT.withCallCredentials(
                        new JwtCallCredentials(
                            ((JwtClaims) exchange.getRequiredAttribute("jwtClaims")).toJson()));

                final var call = managedChannel.newCall(grpcMethodDescriptor, callOptions);

                final var dynamicMessage = ClientCalls.blockingUnaryCall(call, inputMessage);
                // at this point build the GRPC call?
                final byte[] bytes =
                    JsonFormat.printer()
                        .omittingInsignificantWhitespace()
                        .print(dynamicMessage)
                        .getBytes(StandardCharsets.UTF_8);
                final var exchangeResponse = exchange.getResponse();
                var buffer = exchangeResponse.bufferFactory().wrap(bytes);
                exchangeResponse
                    .getHeaders()
                    .add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                exchangeResponse
                    .getHeaders()
                    .add(HttpHeaders.CONTENT_LENGTH, String.valueOf(bytes.length));

                return exchangeResponse.writeWith(Mono.just(buffer)).then(chain.filter(exchange));

              } catch (IOException e) {
                // Fix this later
                return Mono.error(e);
              }
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
