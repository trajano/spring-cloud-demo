package net.trajano.swarm.sampleservice;

import brave.grpc.GrpcTracing;
import io.grpc.*;
import io.grpc.protobuf.services.ProtoReflectionService;
import java.io.IOException;
import java.util.Set;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;

/**
 * This is a GRPC server that's running in the same process as the sample, but will be extracted in
 * the future and the routing logic will be moved to gateway instead.
 */
public class GrpcServer implements DisposableBean, InitializingBean {
  private final Server server;

  public GrpcServer(
      final Set<BindableService> grpcServices,
      GrpcTracing grpcTracing,
      @Value("${grpc.port:50000}") int port) {
    final var serverInterceptor = grpcTracing.newServerInterceptor();
    var b = ServerBuilder.forPort(port);
    grpcServices.forEach(b::addService);
    b.addService(ProtoReflectionService.newInstance()).intercept(serverInterceptor);
    server = b.build();
  }

  @Override
  public void afterPropertiesSet() throws IOException {
    server.start();
  }

  @Override
  public void destroy() throws InterruptedException {
    server.shutdown().awaitTermination();
  }
}
