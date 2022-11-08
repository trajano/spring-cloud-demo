package net.trajano.swarm.sampleservice;

import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Struct;
import com.google.protobuf.util.JsonFormat;
import io.grpc.stub.StreamObserver;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Service;
import reactor.core.publisher.ConnectableFlux;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

@Service
@Slf4j
public class EchoService extends EchoGrpc.EchoImplBase implements InitializingBean {

  private final ScheduledExecutorService executorService =
      Executors.newSingleThreadScheduledExecutor();

  private final ScheduledExecutorService clockExecutor =
      Executors.newSingleThreadScheduledExecutor();

  /** An infinite flux of identifying messages. */
  private ConnectableFlux<String> identifiers;

  @Override
  public void afterPropertiesSet() {

    identifiers =
        Flux.<Long>create(
                sink ->
                    clockExecutor.scheduleAtFixedRate(
                        () -> sink.next(System.currentTimeMillis()), 2, 5, TimeUnit.SECONDS),
                FluxSink.OverflowStrategy.DROP)
            .map(String::valueOf)
            .publish();
    identifiers.connect();
  }

  @Override
  public void echo(
      final EchoOuterClass.EchoRequest request,
      final StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    try {
      final var jwtClaimsStruct = Struct.newBuilder();
      JsonFormat.parser().merge(GrpcServer.JWT_CLAIMS_CONTEXT_KEY.get(), jwtClaimsStruct);

      final EchoOuterClass.EchoResponse response =
          EchoOuterClass.EchoResponse.newBuilder()
              .setMessage(request.getMessage())
              .setJwtClaims(jwtClaimsStruct)
              .build();
      executorService.schedule(
          () -> {
            responseObserver.onNext(response);
            responseObserver.onCompleted();
          },
          100,
          TimeUnit.MILLISECONDS);
    } catch (InvalidProtocolBufferException e) {
      responseObserver.onError(e);
    }
  }

  @Override
  public void echoStream(
      EchoOuterClass.EchoRequest request,
      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    identifiers
        .map(id -> request.getMessage() + " " + id)
        .doOnNext(
            responseMessage ->
                responseObserver.onNext(
                    EchoOuterClass.EchoResponse.newBuilder().setMessage(responseMessage).build()))
        .doOnComplete(responseObserver::onCompleted)
        .subscribe();
  }
}
