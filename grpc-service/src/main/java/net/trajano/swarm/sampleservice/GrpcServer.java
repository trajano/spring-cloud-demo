package net.trajano.swarm.sampleservice;

import brave.Tracing;
import brave.grpc.GrpcTracing;
import io.grpc.BindableService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.protobuf.services.ProtoReflectionService;
import java.io.IOException;
import java.util.Set;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * This is a GRPC server that's running in the same process as the sample, but will be extracted in
 * the future and the routing logic will be moved to gateway instead.
 */
@Service
@Slf4j
public class GrpcServer {
  private final Server server;

  public GrpcServer(
      final Set<BindableService> grpcServices,
      Tracing tracing,
      @Value("${grpc.port:50000}") int port) {
    final var interceptor = GrpcTracing.create(tracing).newServerInterceptor();
    var b = ServerBuilder.forPort(port);
    grpcServices.forEach(b::addService);
    log.info("{} listening on {}", "server", port);
    this.server = b.addService(ProtoReflectionService.newInstance()).intercept(interceptor).build();
  }

  @PostConstruct
  public void start() throws IOException {
    server.start();
    log.info("{} listening on {}", server, server.getPort());
  }

  @PreDestroy
  public void shutdown() throws InterruptedException {
    server.shutdown().awaitTermination();
  }
}
