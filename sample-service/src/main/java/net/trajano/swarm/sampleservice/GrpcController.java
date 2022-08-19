package net.trajano.swarm.sampleservice;

import com.google.protobuf.Any;
import com.google.protobuf.DescriptorProtos;
import com.google.protobuf.Descriptors;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.protobuf.lite.ProtoLiteUtils;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.StreamObserver;
import java.time.Duration;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;
import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@Component
@DependsOn("grpcServer")
public class GrpcController {

  private Map<GrpcServiceMethod, MethodDescriptor<?, ?>> methods = new ConcurrentHashMap<>();

  private ManagedChannel managedChannel;

  private MethodDescriptor<?, ?> methodDescriptorFromProto(
      DescriptorProtos.FileDescriptorProto fileDescriptorProto,
      DescriptorProtos.ServiceDescriptorProto serviceDescriptorProto,
      DescriptorProtos.MethodDescriptorProto methodDescriptorProto)
      throws Descriptors.DescriptorValidationException {

    final var fileDescriptor =
        Descriptors.FileDescriptor.buildFrom(
            fileDescriptorProto, new Descriptors.FileDescriptor[0]);
    System.out.println(fileDescriptor);

    final var methodDescriptorBuilder =
        MethodDescriptor.<Any, Any>newBuilder()
            .setRequestMarshaller(ProtoLiteUtils.marshaller(Any.getDefaultInstance()))
            .setResponseMarshaller(ProtoLiteUtils.marshaller(Any.getDefaultInstance()))
            .setFullMethodName(
                fileDescriptorProto.getPackage()
                    + "."
                    + serviceDescriptorProto.getName()
                    + "/"
                    + methodDescriptorProto.getName());

    if (!methodDescriptorProto.getServerStreaming()
        && !methodDescriptorProto.getClientStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.UNARY);
    } else if (methodDescriptorProto.getServerStreaming()
        && !methodDescriptorProto.getClientStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.SERVER_STREAMING);
    } else if (!methodDescriptorProto.getServerStreaming()) {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.CLIENT_STREAMING);
    } else {
      methodDescriptorBuilder.setType(MethodDescriptor.MethodType.BIDI_STREAMING);
    }
    return methodDescriptorBuilder.build();
  }

  @PostConstruct
  public void obtainDescriptorsFromServer() throws InterruptedException {

    //        final var inProcessServerBuilder = InProcessServerBuilder.forName("internal");
    //        inProcessServerBuilder.addService()
    //        final var server = inProcessServerBuilder.build();

    // for now just pretend we got it
    //
    managedChannel = ManagedChannelBuilder.forAddress("localhost", 50000).usePlaintext().build();
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
                  var fileDescriptorProto =
                      DescriptorProtos.FileDescriptorProto.parseFrom(
                          value.getFileDescriptorResponse().getFileDescriptorProto(0));
                  for (var serviceDescriptorProto : fileDescriptorProto.getServiceList()) {
                    for (var methodDescriptorProto : serviceDescriptorProto.getMethodList()) {
                      var methodDescriptor =
                          methodDescriptorFromProto(
                              fileDescriptorProto, serviceDescriptorProto, methodDescriptorProto);
                      methods.put(
                          new GrpcServiceMethod(
                              serviceDescriptorProto.getName(), methodDescriptorProto.getName()),
                          methodDescriptor);
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
    System.out.println(methods);

    final ClientCall<Any, Any> clientCall =
        managedChannel.newCall(
            (MethodDescriptor<Any, Any>) methods.get(new GrpcServiceMethod("Echo", "echo")),
            CallOptions.DEFAULT);
    try {
      var builder = Any.newBuilder();
      JsonFormat.parser().merge("{\"message\":\"foo\"}", builder);
      final var b = builder.build();
      System.out.println(b);
      clientCall.start(
          new ClientCall.Listener<Any>() {
            @Override
            public void onMessage(Any message) {

              System.out.println("GOT" + message);
            }
          },
          new Metadata());
      clientCall.sendMessage(b);
    } catch (Exception e) {
      e.printStackTrace();
    }
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
      @PathVariable String service, @PathVariable String method, @RequestBody String json) {

    final var methodDescriptor = methods.get(new GrpcServiceMethod(service, method));
    if (methodDescriptor == null) {
      return Mono.error(new IllegalArgumentException("method is not supported"));
    }
    if (!methodDescriptor.getType().serverSendsOneMessage()) {
      // may allow single event in the future
      return Mono.error(
          new IllegalArgumentException("method sends an event stream, but not requested"));
    }

    var builder = Any.newBuilder();
    try {
      JsonFormat.parser().merge(json, builder);
    } catch (InvalidProtocolBufferException e) {
      return Mono.error(e);
    }
    return Mono.just("service + " + service + " method " + method + " data" + json);
  }

  @PostMapping(
      path = "/{service}/{method}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public Flux<ServerSentEvent<String>> serviceCallStreamResult(
      @PathVariable String service, @PathVariable String method, @RequestBody String json) {

    final var methodDescriptor = methods.get(new GrpcServiceMethod(service, method));
    if (methodDescriptor == null) {
      throw new IllegalArgumentException("method is not supported");
    }
    if (methodDescriptor.getType().serverSendsOneMessage()) {
      // may allow single event in the future
      throw new IllegalArgumentException("method does not support event stream");
    }
    return Flux.just(
            "service1 + " + service + " method " + method + " data" + json,
            "service2 + " + service + " method " + method + " data" + json)
        .delayElements(Duration.ofSeconds(1))
        .map(
            s ->
                ServerSentEvent.<String>builder()
                    .id(UUID.randomUUID().toString())
                    .event("a")
                    .comment("comment")
                    .data(s)
                    .build());
  }
}
