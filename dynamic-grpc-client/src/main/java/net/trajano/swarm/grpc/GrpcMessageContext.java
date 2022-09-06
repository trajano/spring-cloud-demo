package net.trajano.swarm.grpc;

import io.grpc.Channel;
import io.grpc.MethodDescriptor;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import java.net.URI;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.With;
import org.springframework.web.server.ServerWebExchange;

@Data
@With
@Builder
@AllArgsConstructor
public class GrpcMessageContext {
  /** GRPC Channel. This must be present. */
  private final Channel channel;

  private final String serviceName;
  private final String methodName;
  private ServerWebExchange serverWebExchange;
  private URI requestUri;
  /** Request JSON. */
  private String requestJson;

  private MethodDescriptor methodDescriptor;

  public ServerReflectionGrpc.ServerReflectionStub getServerReflectionStub() {
    return ServerReflectionGrpc.newStub(channel);
  }

  private List<String> services;
}
