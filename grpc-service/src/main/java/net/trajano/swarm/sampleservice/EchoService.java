package net.trajano.swarm.sampleservice;

import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Struct;
import com.google.protobuf.util.JsonFormat;
import io.grpc.stub.StreamObserver;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Service;
import reactor.core.publisher.ConnectableFlux;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class EchoService extends EchoGrpc.EchoImplBase implements InitializingBean {

  private final ScheduledExecutorService executorService =
      Executors.newSingleThreadScheduledExecutor();

  /** An infinite flux of identifying messages. */
  private ConnectableFlux<String> identifiers;

  @Override
  public void afterPropertiesSet() throws Exception {
    final AtomicLong atomicLong = new AtomicLong(0);
    identifiers =
        Flux.generate(
                () -> 0,
                (state, sink) -> {
                  sink.next(state);
                  return state + 1;
                })
            .map(id -> "%s %d".formatted(Instant.now(), atomicLong.getAndIncrement()))
            .delayElements(Duration.ofSeconds(2))
            .publish();
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
