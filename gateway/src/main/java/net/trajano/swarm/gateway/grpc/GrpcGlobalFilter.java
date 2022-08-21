package net.trajano.swarm.gateway.grpc;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.*;

import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.stub.ClientCalls;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class GrpcGlobalFilter implements GlobalFilter, Ordered {

  private final Map<String, ManagedChannel> channelMap = new ConcurrentHashMap<>();

  private final Map<Channel, Flux<Descriptors.FileDescriptor>> descriptorMap =
      new ConcurrentHashMap<>();

  private final Map<URI, MethodDescriptor<DynamicMessage, DynamicMessage>> grpcDescriptorMap =
      new ConcurrentHashMap<>();

  @PostConstruct
  public void shutdownChannels() {

    channelMap.values().forEach(ManagedChannel::shutdown);
    for (ManagedChannel channel : channelMap.values()) {
      try {
        channel.awaitTermination(1, TimeUnit.MINUTES);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        log.error("Unable to terminate channel {}", channel);
      }
    }
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

    if (!"grpc".equals(exchange.getRequiredAttribute(GATEWAY_SCHEME_PREFIX_ATTR))) {
      return chain.filter(exchange);
    }

    //    final Response r = exchange.getRequiredAttribute(GATEWAY_LOADBALANCER_RESPONSE_ATTR);
    //    System.out.println(r.getServer().getClass());
    //    System.out.println(r.getServer());

    final URI uri = exchange.getRequiredAttribute(GATEWAY_REQUEST_URL_ATTR);
    final var managedChannel =
        channelMap.computeIfAbsent(
            hostPort(uri),
            hostPortFromUri -> {
              // remove hardcoded 50000 and use some secure flag to turn plaintext off
              return ManagedChannelBuilder.forAddress(uri.getHost(), 50000).usePlaintext().build();
            });
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

                final var cc = GrpcFunctions.methodDescriptorFromProtobuf(t.getT2());

                final var dynamicMessage =
                    ClientCalls.blockingUnaryCall(
                        managedChannel, cc, CallOptions.DEFAULT, inputMessage);
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

  private static String hostPort(URI uri) {

    return "%s:%d".formatted(uri.getHost(), uri.getPort());
  }

  @Override
  public int getOrder() {

    return Ordered.LOWEST_PRECEDENCE;
  }
}
