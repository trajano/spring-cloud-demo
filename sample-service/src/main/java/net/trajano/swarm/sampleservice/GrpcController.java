package net.trajano.swarm.sampleservice;

import brave.grpc.GrpcTracing;
import com.google.protobuf.*;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.protobuf.lite.ProtoLiteUtils;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.ClientCalls;
import io.grpc.stub.StreamObserver;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;
import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@Component
@DependsOn("grpcServer")
public class GrpcController {

  @Autowired private GrpcTracing grpcTracing;

  private Map<GrpcServiceMethod, Descriptors.MethodDescriptor> methods = new ConcurrentHashMap<>();

  private ManagedChannel managedChannel;

  private MethodDescriptor<DynamicMessage, DynamicMessage> methodDescriptorFromProtobuf(
      Descriptors.MethodDescriptor methodDescriptorFromProtobuf) {

    final var methodDescriptorBuilder =
        MethodDescriptor.<DynamicMessage, DynamicMessage>newBuilder(
                ProtoLiteUtils.marshaller(
                    DynamicMessage.getDefaultInstance(methodDescriptorFromProtobuf.getInputType())),
                ProtoLiteUtils.marshaller(
                    DynamicMessage.getDefaultInstance(
                        methodDescriptorFromProtobuf.getOutputType())))
            .setIdempotent(
                methodDescriptorFromProtobuf.getOptions().getIdempotencyLevel()
                    != DescriptorProtos.MethodOptions.IdempotencyLevel.IDEMPOTENCY_UNKNOWN)
            .setFullMethodName(
                MethodDescriptor.generateFullMethodName(
                    methodDescriptorFromProtobuf.getService().getFullName(),
                    methodDescriptorFromProtobuf.getName()))
            .setSchemaDescriptor(methodDescriptorFromProtobuf);

    if (!methodDescriptorFromProtobuf.isServerStreaming()
        && !methodDescriptorFromProtobuf.isClientStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.UNARY);
    } else if (methodDescriptorFromProtobuf.isServerStreaming()
        && !methodDescriptorFromProtobuf.isClientStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.SERVER_STREAMING);
    } else if (!methodDescriptorFromProtobuf.isServerStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.CLIENT_STREAMING);
    } else {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.BIDI_STREAMING);
    }
    return methodDescriptorBuilder.build();
  }

  @PostConstruct
  public void obtainDescriptorsFromServer() throws InterruptedException {

    managedChannel =
        ManagedChannelBuilder.forAddress("localhost", 50000)
            .usePlaintext()
            .intercept(grpcTracing.newClientInterceptor())
            .build();
    final var serverReflectionBlockingStub = ServerReflectionGrpc.newStub(managedChannel);

    final var serviceListLatch = new CountDownLatch(1);
    final Set<String> serviceNames = new HashSet<>();
    final var errorRef = new AtomicReference<Throwable>();
    final var serviceListObserver =
        serverReflectionBlockingStub.serverReflectionInfo(
            new StreamObserver<>() {
              @Override
              public void onNext(ServerReflectionResponse value) {

                value.getListServicesResponse().getServiceList().stream()
                    .map(ServiceResponse::getName)
                    .forEach(serviceNames::add);
              }

              @Override
              public void onError(Throwable t) {

                errorRef.set(t);
                serviceListLatch.countDown();
              }

              @Override
              public void onCompleted() {

                serviceListLatch.countDown();
              }
            });
    serviceListObserver.onNext(ServerReflectionRequest.newBuilder().setListServices("*").build());
    serviceListObserver.onCompleted();
    serviceListLatch.await();
    if (errorRef.get() != null) {
      throw new IllegalStateException(errorRef.get());
    }

    final var serviceFileLatch = new CountDownLatch(1);
    final var serviceFileProtoObserver =
        serverReflectionBlockingStub.serverReflectionInfo(
            new StreamObserver<>() {
              @Override
              public void onNext(ServerReflectionResponse value) {

                try {
                  final var fileDescriptorProto =
                      DescriptorProtos.FileDescriptorProto.parseFrom(
                          value.getFileDescriptorResponse().getFileDescriptorProto(0));
                  final var fileDescriptor =
                      Descriptors.FileDescriptor.buildFrom(
                          fileDescriptorProto, new Descriptors.FileDescriptor[0]);
                  for (var service : fileDescriptor.getServices()) {
                    for (var method : service.getMethods()) {
                      methods.put(
                          new GrpcServiceMethod(service.getName(), method.getName()), method);
                    }
                  }

                } catch (Exception e) {
                  errorRef.set(e);
                  serviceFileLatch.countDown();
                }
              }

              @Override
              public void onError(Throwable t) {

                errorRef.set(t);
                serviceFileLatch.countDown();
              }

              @Override
              public void onCompleted() {

                serviceFileLatch.countDown();
              }
            });
    serviceNames.stream()
        .map(name -> ServerReflectionRequest.newBuilder().setFileContainingSymbol(name).build())
        .forEach(serviceFileProtoObserver::onNext);
    serviceFileProtoObserver.onCompleted();
    serviceFileLatch.await();
  }

  // Phase 1 simple strings
  // phase 2 map to GRPC call to server that is running internally.  Ideally external server
  // if it was an external server then gateway can handle the translation instead.
  // but how would gateway know what to build?

  @PostMapping(
      path = "/{service}/{method}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public Mono<String> serviceCall(
      @PathVariable String service,
      @PathVariable String method,
      @RequestBody DataBuffer dataBuffer) {

    log.error("ASDJLKDJASKLD");
    final var methodDescriptor = methods.get(new GrpcServiceMethod(service, method));
    if (methodDescriptor == null) {
      return Mono.error(new IllegalArgumentException("method is not supported"));
    }
    if (methodDescriptor.isServerStreaming()) {
      // may allow single event in the future
      return Mono.error(
          new IllegalArgumentException("method sends an event stream, but not requested"));
    }

    try (final var jsonReader = new InputStreamReader(dataBuffer.asInputStream())) {
      var builder = DynamicMessage.newBuilder(methodDescriptor.getInputType());
      JsonFormat.parser().merge(jsonReader, builder);
      final var b = builder.build();

      final var dynamicMessage =
          ClientCalls.blockingUnaryCall(
              managedChannel,
              methodDescriptorFromProtobuf(methodDescriptor),
              CallOptions.DEFAULT,
              b);

      return Mono.just(
          JsonFormat.printer().omittingInsignificantWhitespace().print(dynamicMessage));
    } catch (Exception e) {
      return Mono.error(e);
    }
  }

  @PostMapping(
      path = "/{service}/{method}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public Flux<ServerSentEvent<String>> serviceCallStreamResult(
      @PathVariable String service,
      @PathVariable String method,
      @RequestBody DataBuffer dataBuffer) {

    log.error("FOO");
    final var methodDescriptor = methods.get(new GrpcServiceMethod(service, method));
    if (methodDescriptor == null) {
      throw new IllegalArgumentException("method is not supported");
    }
    if (!methodDescriptor.isServerStreaming()) {
      // may allow single event in the future
      throw new IllegalArgumentException("method does not support event stream");
    }

    try (final var jsonReader = new InputStreamReader(dataBuffer.asInputStream())) {
      var builder = DynamicMessage.newBuilder(methodDescriptor.getInputType());
      JsonFormat.parser().merge(jsonReader, builder);
      final var b = builder.build();

      return Flux.<DynamicMessage>create(
              emitter -> {
                ClientCalls.asyncServerStreamingCall(
                    managedChannel.newCall(
                        methodDescriptorFromProtobuf(methodDescriptor), CallOptions.DEFAULT),
                    b,
                    new StreamObserver<>() {
                      @Override
                      public void onNext(DynamicMessage dynamicMessage1) {

                        emitter.next(dynamicMessage1);
                      }

                      @Override
                      public void onError(Throwable t) {

                        emitter.error(t);
                      }

                      @Override
                      public void onCompleted() {

                        emitter.complete();
                      }
                    });
              },
              FluxSink.OverflowStrategy.BUFFER)
          .map(
              dynamicMessage -> {
                try {
                  return JsonFormat.printer()
                      .omittingInsignificantWhitespace()
                      .print(dynamicMessage);
                } catch (InvalidProtocolBufferException e) {
                  throw new IllegalStateException(e);
                }
              })
          .map(json -> ServerSentEvent.<String>builder().data(json).build());

    } catch (Exception e) {
      return Flux.error(e);
    }
  }
}
