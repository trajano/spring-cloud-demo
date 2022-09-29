package net.trajano.swarm.gateway.grpc;

import com.google.protobuf.DescriptorProtos;
import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.InvalidProtocolBufferException;
import io.grpc.Channel;
import io.grpc.MethodDescriptor;
import io.grpc.protobuf.lite.ProtoLiteUtils;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.StreamObserver;
import java.net.URI;
import java.util.Collection;
import java.util.List;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Facade for the {@link ServerReflectionGrpc.ServerReflectionStub}. */
public class GrpcServerReflection {

  private ServerReflectionGrpc.ServerReflectionStub serverReflectionStub;

  public GrpcServerReflection(final Channel channel) {
    this.serverReflectionStub = ServerReflectionGrpc.newStub(channel);
  }

  public static Descriptors.FileDescriptor buildFrom(
      DescriptorProtos.FileDescriptorProto descriptorProto,
      Collection<Descriptors.FileDescriptor> dependencies) {
    try {
      return Descriptors.FileDescriptor.buildFrom(
          descriptorProto, dependencies.toArray(Descriptors.FileDescriptor[]::new));
    } catch (Descriptors.DescriptorValidationException e) {
      throw new IllegalStateException(e);
    }
  }

  public static Descriptors.FileDescriptor buildFrom(
      DescriptorProtos.FileDescriptorProto descriptorProto,
      Descriptors.FileDescriptor... dependencies) {
    try {
      return Descriptors.FileDescriptor.buildFrom(descriptorProto, dependencies);
    } catch (Descriptors.DescriptorValidationException e) {
      throw new IllegalStateException(e);
    }
  }

  public static Flux<Descriptors.FileDescriptor> fileDescriptorsForDependencies(
      DescriptorProtos.FileDescriptorProto d,
      ServerReflectionGrpc.ServerReflectionStub serverReflectionStub) {
    return Flux.fromIterable(d.getDependencyList())
        .map(x -> ServerReflectionRequest.newBuilder().setFileByFilename(x).build())
        .flatMap(
            depReq ->
                Mono.<DescriptorProtos.FileDescriptorProto>create(
                    sink -> {
                      final var serverReflectionRequestStreamObserver =
                          serverReflectionStub.serverReflectionInfo(
                              new StreamObserver<>() {
                                @Override
                                public void onCompleted() {
                                  // no-op
                                }

                                @Override
                                public void onError(Throwable t) {

                                  sink.error(t);
                                }

                                @Override
                                public void onNext(ServerReflectionResponse value) {

                                  try {
                                    sink.success(
                                        DescriptorProtos.FileDescriptorProto.parseFrom(
                                            value
                                                .getFileDescriptorResponse()
                                                .getFileDescriptorProto(0)));
                                  } catch (InvalidProtocolBufferException e) {
                                    sink.error(e);
                                  }
                                }
                              });
                      serverReflectionRequestStreamObserver.onNext(depReq);
                      serverReflectionRequestStreamObserver.onCompleted();
                    }))
        .flatMap(
            fileDescriptorProto ->
                fileDescriptorsForDependencies(fileDescriptorProto, serverReflectionStub)
                    .collectList()
                    .map(
                        dependentFileDescriptors ->
                            GrpcServerReflection.buildFrom(
                                fileDescriptorProto, dependentFileDescriptors)));
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

  public static Mono<Descriptors.FileDescriptor> buildServiceFromProto(
      ServerReflectionGrpc.ServerReflectionStub serverReflectionStub,
      DescriptorProtos.FileDescriptorProto serviceDescriptorProto) {
    final var fileDescriptorFlux =
        fileDescriptorsForDependencies(serviceDescriptorProto, serverReflectionStub)
            .collectList()
            .map(fileDescriptors -> fileDescriptors.toArray(Descriptors.FileDescriptor[]::new));
    return Mono.zip(
        o ->
            GrpcServerReflection.buildFrom(
                (DescriptorProtos.FileDescriptorProto) o[0], (Descriptors.FileDescriptor[]) o[1]),
        Mono.just(serviceDescriptorProto),
        fileDescriptorFlux);
  }

  public static Mono<Descriptors.MethodDescriptor> methodDescriptor(
      URI uri, Flux<Descriptors.FileDescriptor> fileDescriptorFlux) {
    String[] pathElements = uri.getPath().split("/");
    return fileDescriptorFlux
        .flatMap(fileDescriptor -> Flux.fromIterable(fileDescriptor.getServices()))
        .filter(serviceDescriptor -> pathElements[1].equals(serviceDescriptor.getName()))
        .flatMap(serviceDescriptor -> Flux.fromIterable(serviceDescriptor.getMethods()))
        .filter(methodDescriptor -> pathElements[2].equals(methodDescriptor.getName()))
        .last();
  }

  public Mono<Descriptors.FileDescriptor> buildServiceFromProto(
      DescriptorProtos.FileDescriptorProto serviceDescriptorProto) {
    final var fileDescriptorFlux =
        fileDescriptorsForDependencies(serviceDescriptorProto, serverReflectionStub)
            .collectList()
            .map(fileDescriptors -> fileDescriptors.toArray(Descriptors.FileDescriptor[]::new));
    return Mono.zip(
        o ->
            GrpcServerReflection.buildFrom(
                (DescriptorProtos.FileDescriptorProto) o[0], (Descriptors.FileDescriptor[]) o[1]),
        Mono.just(serviceDescriptorProto),
        fileDescriptorFlux);
  }

  public Mono<DescriptorProtos.FileDescriptorProto> fileDescriptorForService(final String service) {

    return Mono.create(
        emitter -> {
          final var serviceFileProtoObserver =
              serverReflectionStub.serverReflectionInfo(
                  new StreamObserver<>() {
                    @Override
                    public void onCompleted() {

                      // no-op

                    }

                    @Override
                    public void onError(Throwable t) {

                      emitter.error(t);
                    }

                    @Override
                    public void onNext(ServerReflectionResponse value) {

                      try {
                        emitter.success(
                            DescriptorProtos.FileDescriptorProto.parseFrom(
                                value.getFileDescriptorResponse().getFileDescriptorProto(0)));
                      } catch (Exception e) {
                        emitter.error(e);
                      }
                    }
                  });
          serviceFileProtoObserver.onNext(
              ServerReflectionRequest.newBuilder().setFileContainingSymbol(service).build());
          serviceFileProtoObserver.onCompleted();
        });
  }

  public Flux<DescriptorProtos.FileDescriptorProto> fileDescriptors() {

    return servicesFromReflection().flatMap(this::fileDescriptorForService);
  }

  public Flux<String> servicesFromReflection() {

    return Mono.<List<ServiceResponse>>create(
            emitter -> {
              final var serviceListObserver =
                  serverReflectionStub.serverReflectionInfo(
                      new StreamObserver<>() {
                        @Override
                        public void onCompleted() {

                          // no-op

                        }

                        @Override
                        public void onError(Throwable t) {

                          emitter.error(t);
                        }

                        @Override
                        public void onNext(ServerReflectionResponse value) {

                          emitter.success(value.getListServicesResponse().getServiceList());
                        }
                      });
              serviceListObserver.onNext(
                  ServerReflectionRequest.newBuilder().setListServices("*").build());
              serviceListObserver.onCompleted();
            })
        .flatMapMany(Flux::fromIterable)
        .map(ServiceResponse::getName);
  }
}
