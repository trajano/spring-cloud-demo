package net.trajano.swarm.gateway;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import org.springframework.context.annotation.Bean;

public class CryptoProvider {

  @Bean
  SecureRandom secureRandom() {
    try {
      return SecureRandom.getInstanceStrong();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
