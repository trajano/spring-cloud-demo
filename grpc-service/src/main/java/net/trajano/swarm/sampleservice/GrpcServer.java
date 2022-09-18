package net.trajano.swarm.sampleservice;

import brave.Tracing;
import brave.grpc.GrpcTracing;
import io.grpc.*;
import io.grpc.protobuf.services.ProtoReflectionService;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * This is a GRPC server that's running in the same process as the sample, but will be extracted in
 * the future and the routing logic will be moved to gateway instead.
 */
@Service
@Slf4j
public class GrpcServer implements DisposableBean {
  public static Metadata.Key<String> JWT_CLAIMS_KEY =
      Metadata.Key.of("jwtClaims", Metadata.ASCII_STRING_MARSHALLER);

  public static Context.Key<String> JWT_CLAIMS_CONTEXT_KEY = Context.key("jwtClaims");

  private final Server server;

  /** Define an executor to handle the work rather than relying on the default. */
  private final ExecutorService executor =
      Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());

  public GrpcServer(
      final Set<BindableService> grpcServices,
      final Tracing tracing,
      @Value("${grpc.port:50000}") int port) {
    final var interceptor = GrpcTracing.create(tracing).newServerInterceptor();
    var b = ServerBuilder.forPort(port).executor(executor);
    grpcServices.forEach(b::addService);
    log.info("{} listening on {}", "server", port);
    this.server =
        b.addService(ProtoReflectionService.newInstance())
            .intercept(interceptor)
            .intercept(new JwtClaimsInterceptor())
            .build();
  }

  @Override
  public void destroy() throws Exception {
    executor.shutdown();
    server.shutdown().awaitTermination();
  }

  public Server start() throws IOException {
    server.start();
    log.info("{} listening on {}", server, server.getPort());
    return server;
  }

  private static class JwtClaimsInterceptor implements ServerInterceptor {

    @Override
    public <Req, Resp> ServerCall.Listener<Req> interceptCall(
        ServerCall<Req, Resp> call, Metadata headers, ServerCallHandler<Req, Resp> next) {
      final var context =
          Context.current().withValue(JWT_CLAIMS_CONTEXT_KEY, headers.get(JWT_CLAIMS_KEY));
      return Contexts.interceptCall(context, call, headers, next);
    }
  }
}
