package net.trajano.swarm.grpc;

import io.grpc.Channel;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.StreamObserver;
import reactor.core.publisher.Mono;

public class Client {

  public void send(Channel channel, final String serviceName, final String methodName) {

    //        serverWebExchange.getRequest().
    Mono.just(
            GrpcMessageContext.builder()
                .channel(channel)
                .serviceName(serviceName)
                .methodName(methodName)
                .build())
        .flatMap(this::obtainServicesFromChannel)
        .flatMap(this::obtainFileFromChannel);
  }

  private Mono<GrpcMessageContext> obtainFileFromChannel(GrpcMessageContext grpcMessageContext) {

    final var stub = grpcMessageContext.getServerReflectionStub();
    return Mono.<GrpcMessageContext>create(
        sink -> {
          final var infoCall =
              stub.serverReflectionInfo(
                  new StreamObserver<ServerReflectionResponse>() {
                    @Override
                    public void onNext(ServerReflectionResponse servicesReflectionResponse) {
                      sink.success(
                          grpcMessageContext.withServices(
                              servicesReflectionResponse
                                  .getListServicesResponse()
                                  .getServiceList()
                                  .stream()
                                  .map(ServiceResponse::getName)
                                  .toList()));
                    }

                    @Override
                    public void onError(Throwable t) {
                      sink.error(t);
                    }

                    @Override
                    public void onCompleted() {
                      // no-op
                    }
                  });
          infoCall.onNext(ServerReflectionRequest.newBuilder().setListServices("*").build());
          infoCall.onCompleted();
        });
  }

  private Mono<GrpcMessageContext> obtainServicesFromChannel(
      GrpcMessageContext grpcMessageContext) {

    final var stub = grpcMessageContext.getServerReflectionStub();
    return Mono.<GrpcMessageContext>create(
        sink -> {
          final var infoCall =
              stub.serverReflectionInfo(
                  new StreamObserver<ServerReflectionResponse>() {
                    @Override
                    public void onNext(ServerReflectionResponse servicesReflectionResponse) {
                      sink.success(
                          grpcMessageContext.withServices(
                              servicesReflectionResponse
                                  .getListServicesResponse()
                                  .getServiceList()
                                  .stream()
                                  .map(ServiceResponse::getName)
                                  .toList()));
                    }

                    @Override
                    public void onError(Throwable t) {
                      sink.error(t);
                    }

                    @Override
                    public void onCompleted() {
                      // no-op
                    }
                  });
          infoCall.onNext(ServerReflectionRequest.newBuilder().setListServices("*").build());
          infoCall.onCompleted();
        });
  }
}
