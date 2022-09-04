package net.trajano.swarm.jwksprovider;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CryptoProvider {

  @Bean
  SecureRandom secureRandom() throws NoSuchAlgorithmException {

    return SecureRandom.getInstanceStrong();
  }
}
