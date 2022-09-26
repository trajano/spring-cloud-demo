package net.trajano.swarm.sampleservice;

import io.grpc.stub.StreamObserver;
import java.time.Duration;
import java.util.stream.IntStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class EchoService extends EchoGrpc.EchoImplBase {

  @Override
  public void echo(
      EchoOuterClass.EchoRequest request,
      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    //    System.out.println(GrpcServer.JWT_CLAIMS_CONTEXT_KEY.get());
    responseObserver.onNext(
        EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build());
    responseObserver.onCompleted();
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
