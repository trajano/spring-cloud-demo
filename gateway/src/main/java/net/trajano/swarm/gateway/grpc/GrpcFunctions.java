package net.trajano.swarm.gateway.grpc;

import com.google.protobuf.DescriptorProtos;
import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.MethodDescriptor;
import io.grpc.protobuf.lite.ProtoLiteUtils;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.StreamObserver;
import java.net.URI;
import java.util.List;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class GrpcFunctions {

  public static Mono<ManagedChannel> managedChannel(String host, int port, boolean secure) {

    return Mono.defer(
        () -> {
          final ManagedChannelBuilder<?> managedChannelBuilder =
              ManagedChannelBuilder.forAddress(host, port);
          if (!secure) {
            managedChannelBuilder.usePlaintext();
          }
          return Mono.just(managedChannelBuilder.build());
        });
  }

  public static Mono<List<String>> servicesFromReflection(
      ServerReflectionGrpc.ServerReflectionStub serverReflectionBlockingStub) {

    return Mono.create(
        emitter -> {
          final var serviceListObserver =
              serverReflectionBlockingStub.serverReflectionInfo(
                  new StreamObserver<>() {
                    @Override
                    public void onNext(ServerReflectionResponse value) {

                      emitter.success(
                          value.getListServicesResponse().getServiceList().stream()
                              .map(ServiceResponse::getName)
                              .toList());
                    }

                    @Override
                    public void onError(Throwable t) {

                      emitter.error(t);
                    }

                    @Override
                    public void onCompleted() {

                      // no-op

                    }
                  });
          serviceListObserver.onNext(
              ServerReflectionRequest.newBuilder().setListServices("*").build());
          serviceListObserver.onCompleted();
        });
  }

  public static Flux<DescriptorProtos.FileDescriptorProto> fileDescriptorForServices(
      final ServerReflectionGrpc.ServerReflectionStub serverReflectionBlockingStub,
      final List<String> services) {

    return Flux.create(
        emitter -> {
          final var serviceFileProtoObserver =
              serverReflectionBlockingStub.serverReflectionInfo(
                  new StreamObserver<>() {
                    @Override
                    public void onNext(ServerReflectionResponse value) {

                      try {
                        emitter.next(
                            DescriptorProtos.FileDescriptorProto.parseFrom(
                                value.getFileDescriptorResponse().getFileDescriptorProto(0)));
                      } catch (Exception e) {
                        emitter.error(e);
                      }
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
          services.stream()
              .map(
                  name ->
                      ServerReflectionRequest.newBuilder().setFileContainingSymbol(name).build())
              .forEach(serviceFileProtoObserver::onNext);
          serviceFileProtoObserver.onCompleted();
        });
  }

  public static Descriptors.FileDescriptor buildFrom(
      DescriptorProtos.FileDescriptorProto descriptorProto) {
    try {
      return Descriptors.FileDescriptor.buildFrom(
          descriptorProto, new Descriptors.FileDescriptor[0]);
    } catch (Descriptors.DescriptorValidationException e) {
      throw new RuntimeException(e);
    }
  }

  public static MethodDescriptor<DynamicMessage, DynamicMessage> methodDescriptorFromProtobuf(
      Descriptors.MethodDescriptor methodDescriptorFromProtobuf) {

    final var methodDescriptorBuilder =
        MethodDescriptor.newBuilder(
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

  public static Flux<DescriptorProtos.FileDescriptorProto> fileDescriptors(
      ServerReflectionGrpc.ServerReflectionStub serverReflectionBlockingStub) {

    return servicesFromReflection(serverReflectionBlockingStub)
        .flatMapMany(services -> fileDescriptorForServices(serverReflectionBlockingStub, services));
  }

  public static Mono<Descriptors.MethodDescriptor> methodDescriptor(
      URI uri, Flux<Descriptors.FileDescriptor> fileDescriptorFlux) {
    String[] pathElements = uri.getPath().split("/");
    return fileDescriptorFlux
        .flatMap(fileDescriptor -> Flux.fromIterable(fileDescriptor.getServices()))
        .filter(serviceDescriptor -> pathElements[1].equals(serviceDescriptor.getName()))
        .flatMap(serviceDescriptor -> Flux.fromIterable(serviceDescriptor.getMethods()))
        .filter(methodDescriptor -> pathElements[2].equals(methodDescriptor.getName()))
        //                .map(GrpcFunctions::methodDescriptorFromProtobuf)
        .last();
  }
}
