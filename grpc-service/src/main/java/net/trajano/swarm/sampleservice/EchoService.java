package net.trajano.swarm.sampleservice;

import io.grpc.stub.StreamObserver;
import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class EchoService extends EchoGrpc.EchoImplBase {

  private final ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();
  @Override
  public void echo(
final      EchoOuterClass.EchoRequest request,
final      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    final var response = EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build();
    //    System.out.println(GrpcServer.JWT_CLAIMS_CONTEXT_KEY.get());
    executorService.schedule(()-> {
      responseObserver.onNext(
              response);
      responseObserver.onCompleted();
    }, 100, TimeUnit.MILLISECONDS);
  }

  @Override
  public void echoStream(
      EchoOuterClass.EchoRequest request,
      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    Flux.fromStream(IntStream.range(0, 100).boxed())
        .delayElements(Duration.ofSeconds(2))
        .doOnNext(
            id ->
                responseObserver.onNext(
                    EchoOuterClass.EchoResponse.newBuilder()
                        .setMessage(request.getMessage() + " " + id)
                        .build()))
        .doOnComplete(responseObserver::onCompleted)
        .subscribe();
  }
}
