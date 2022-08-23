package net.trajano.swarm.sampleservice;

import brave.Tracing;
import brave.grpc.GrpcTracing;
import io.grpc.*;
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

  public static Metadata.Key<String> JWT_CLAIMS_KEY =
      Metadata.Key.of("jwtClaims", Metadata.ASCII_STRING_MARSHALLER);

  public static Context.Key<String> JWT_CLAIMS_CONTEXT_KEY = Context.key("jwtClaims");

  public GrpcServer(
      final Set<BindableService> grpcServices,
      Tracing tracing,
      @Value("${grpc.port:50000}") int port) {
    final var interceptor = GrpcTracing.create(tracing).newServerInterceptor();
    var b = ServerBuilder.forPort(port);
    grpcServices.forEach(b::addService);
    log.info("{} listening on {}", "server", port);
    this.server =
        b.addService(ProtoReflectionService.newInstance())
            .intercept(interceptor)
            .intercept(
                new ServerInterceptor() {
                  @Override
                  public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
                      ServerCall<ReqT, RespT> call,
                      Metadata headers,
                      ServerCallHandler<ReqT, RespT> next) {
                    final var context =
                        Context.current()
                            .withValue(JWT_CLAIMS_CONTEXT_KEY, headers.get(JWT_CLAIMS_KEY));
                    return Contexts.interceptCall(context, call, headers, next);
                  }
                })
            .build();
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
