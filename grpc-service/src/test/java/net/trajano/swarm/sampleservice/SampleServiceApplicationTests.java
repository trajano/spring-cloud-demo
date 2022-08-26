package net.trajano.swarm.sampleservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import io.grpc.Server;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@SpringBootTest
class SampleServiceApplicationTests {
  @Autowired private EchoService echoService;
  @Autowired private GrpcServer grpcServer;

  @TestConfiguration
  static class Config {
    @Bean
    @Primary
    GrpcServer grpcServer2() {
      var mockServer = mock(GrpcServer.class);
      try {
        doReturn(mock(Server.class)).when(mockServer).start();
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
      return mockServer;
    }
  }

  @Test
  void contextLoads() {
    assertThat(echoService).isNotNull();
  }

  @BeforeEach
  void initMocks() throws Exception {}
}
