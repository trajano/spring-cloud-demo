package net.trajano.swarm.sampleservice;

import brave.Tracing;
import brave.grpc.GrpcTracing;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SampleServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(SampleServiceApplication.class, args);
  }

  @Bean
  GrpcTracing grpcTracing(Tracing tracing) {

    return GrpcTracing.create(tracing);
  }
}
