package net.trajano.swarm.sampleservice;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.google.protobuf.Any;
import com.google.protobuf.AnyOrBuilder;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Message;
import com.google.protobuf.util.JsonFormat;
import io.grpc.*;
import io.grpc.protobuf.services.ProtoReflectionService;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;

@RestController
@Slf4j
@Component
@DependsOn("grpcServer")
public class GrpcController {

    private Map<GrpcServiceMethod, MethodDescriptor<?, ?>> methods;

    @PostConstruct
    public void obtainDescriptorsFromServer() {

        var managedChannel = ManagedChannelBuilder.forAddress("localhost", 50000).usePlaintext().build();
        var y = managedChannel.newCall(ServerReflectionGrpc.getServerReflectionInfoMethod(),
                CallOptions.DEFAULT
        );
        y.sendMessage(
                ServerReflectionRequest.newBuilder()
                        .build());

//managedChannel.newCall(ProtoReflect)

//        ServerBuilder.forPort(9090).build();
//        methods = grpcServices.stream()
//                .map(BindableService::bindService)
//                .map(ServerServiceDefinition::getServiceDescriptor)
//                .flatMap(serviceDescriptor -> serviceDescriptor.getMethods().stream())
//                .collect(
//                        Collectors.toMap(methodDescriptor -> new GrpcServiceMethod(methodDescriptor.getServiceName(),
//                                methodDescriptor.getBareMethodName()), methodDescriptor -> methodDescriptor)
//                );

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
            return Mono.error(new IllegalArgumentException("method sends an event stream, but not requested"));
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
