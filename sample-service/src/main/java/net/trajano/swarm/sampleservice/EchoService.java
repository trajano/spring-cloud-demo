package net.trajano.swarm.sampleservice;

import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Component;

@Component
public class EchoService extends EchoGrpc.EchoImplBase {

  @Override
  public void echo(
      EchoOuterClass.EchoRequest request,
      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    responseObserver.onNext(
        EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build());
    responseObserver.onCompleted();
  }

  @Override
  public void echoStream(
      EchoOuterClass.EchoRequest request,
      StreamObserver<EchoOuterClass.EchoResponse> responseObserver) {

    responseObserver.onNext(
        EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build());
    responseObserver.onNext(
        EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build());
    responseObserver.onNext(
        EchoOuterClass.EchoResponse.newBuilder().setMessage(request.getMessage()).build());
    responseObserver.onCompleted();
  }
}
