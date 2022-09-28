package net.trajano.swarm.jwksprovider;

import net.trajano.swarm.jwksprovider.redis.JwksRedisPopulator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class JwkProviderApplicationTests {

  @Autowired private JwksRedisPopulator jwksPopulator;

  @Test
  void contextLoads() {
    assertThat(jwksPopulator).isNotNull();
  }
}
