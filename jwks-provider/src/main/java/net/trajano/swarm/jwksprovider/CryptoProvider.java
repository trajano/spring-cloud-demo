package net.trajano.swarm.jwksprovider;

import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CryptoProvider {

  private static final String RSA = "RSA";

  @Bean
  KeyPairGenerator keyPairGenerator() throws NoSuchAlgorithmException {

    final var keyPairGenerator = KeyPairGenerator.getInstance(RSA);
    keyPairGenerator.initialize(2048);
    return keyPairGenerator;
  }

  @Bean
  SecureRandom secureRandom() throws NoSuchAlgorithmException {

    return SecureRandom.getInstanceStrong();
  }
}
