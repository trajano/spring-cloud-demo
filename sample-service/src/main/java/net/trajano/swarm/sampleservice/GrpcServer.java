package net.trajano.swarm.sampleservice;

import io.grpc.BindableService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.ServerMethodDefinition;
import io.grpc.protobuf.services.ProtoReflectionService;
import java.io.IOException;
import java.util.Set;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import org.springframework.stereotype.Service;

/**
 * This is a GRPC server that's running in the same process as the sample, but will be extracted in
 * the future and the routing logic will be moved to gateway instead.
 */
@Service
public class GrpcServer {
  private final Server server;

  public GrpcServer(final Set<BindableService> grpcServices) {
    var b = ServerBuilder.forPort(50000);
    System.out.println(grpcServices);
    grpcServices.forEach(b::addService);
    b.addService(ProtoReflectionService.newInstance());
    server = b.build();
  }

  @PostConstruct
  public void start() throws IOException {
    server.start();
    server.getImmutableServices().stream()
        .flatMap(s -> s.getMethods().stream())
        .map(ServerMethodDefinition::getMethodDescriptor)
        .forEach(System.out::println);
  }

  @PreDestroy
  public void shutdown() throws InterruptedException {
    server.shutdown().awaitTermination();
  }
}
