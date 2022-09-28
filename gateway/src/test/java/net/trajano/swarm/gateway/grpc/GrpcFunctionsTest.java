package net.trajano.swarm.gateway.grpc;

import static net.trajano.swarm.gateway.grpc.GrpcFunctions.*;

import io.grpc.ManagedChannelBuilder;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import org.junit.jupiter.api.Test;

class GrpcFunctionsTest {

  @Test
  void foo() {

    final var localhost =
        ManagedChannelBuilder.forAddress("localhost", 28088)
            .directExecutor()
            .usePlaintext()
            .build();
    final var serverReflectionStub = ServerReflectionGrpc.newStub(localhost);
    final var block =
        GrpcFunctions.servicesFromReflection(serverReflectionStub)
            .flatMapMany(services -> fileDescriptorForServices(serverReflectionStub, services))
            .flatMap(
                serviceDescriptorProto ->
                    GrpcFunctions.buildServiceFromProto(
                        serverReflectionStub, serviceDescriptorProto))
            .collectList()
            .block();
    System.out.println(block);
  }
}
