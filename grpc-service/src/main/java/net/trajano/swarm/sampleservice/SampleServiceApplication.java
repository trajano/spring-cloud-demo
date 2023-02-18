package net.trajano.swarm.sampleservice;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SampleServiceApplication implements InitializingBean {

  @Autowired private GrpcServer grpcServer;

  public static void main(String[] args) {

    SpringApplication.run(SampleServiceApplication.class, args);
  }

  @Override
  public void afterPropertiesSet() {

    final var executorService = Executors.newSingleThreadExecutor();
    executorService.submit(
        () -> {
          try {
            grpcServer.start().awaitTermination();
          } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
          } catch (IOException e) {
            throw new UncheckedIOException(e);
          }
        });
  }
}
