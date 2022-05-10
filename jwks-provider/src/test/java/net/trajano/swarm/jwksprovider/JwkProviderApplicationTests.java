package net.trajano.swarm.jwksprovider;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class JwkProviderApplicationTests {

  @Autowired private JwksPopulator jwksPopulator;

  @Test
  void contextLoads() {
    assertThat(jwksPopulator).isNotNull();
  }
}
