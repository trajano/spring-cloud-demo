package net.trajano.swarm.sampleservice;

import brave.grpc.GrpcTracing;
import io.grpc.*;
import io.grpc.protobuf.services.ProtoReflectionService;
import java.io.IOException;
import java.util.Set;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/**
 * This is a GRPC server that's running in the same process as the sample, but will be extracted in
 * the future and the routing logic will be moved to gateway instead.
 */
public class GrpcServer {
  private final Server server;

  public GrpcServer(final Set<BindableService> grpcServices, GrpcTracing grpcTracing) {
    final var serverInterceptor = grpcTracing.newServerInterceptor();
    var b = ServerBuilder.forPort(50000);
    grpcServices.forEach(b::addService);
    b.addService(ProtoReflectionService.newInstance()).intercept(serverInterceptor);
    server = b.build();
  }

  @PostConstruct
  public void start() throws IOException {
    server.start();
  }

  @PreDestroy
  public void shutdown() throws InterruptedException {
    server.shutdown().awaitTermination();
  }
}
