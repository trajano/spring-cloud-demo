package net.trajano.swarm.jwksprovider;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.util.function.Consumer;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.lang.JoseException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SynchronousSink;

@Service
@RequiredArgsConstructor
public class JsonWebKeyPairProvider {

  public static final String RSA = "RSA";

  /** Possible characters for the KID */
  private static final char[] POSSIBLE_KID_CHARACTERS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray();

  private final AuthProperties authProperties;

  private final KeyPairGenerator keyPairGenerator;

  private final SecureRandom secureRandom;

  /** This is a hot flux for JSON Web key pairs. */
  private Flux<JsonWebKeySet> jsonWebKeySetFlux;

  /**
   * There is no need for the KID to be too long. string which gives enough space to prevent
   * duplicates, should there be a duplicate it just reduces the amount of selectable keys, but
   * there will at least be one.
   *
   * @return generated KID
   */
  private String generateKid() {

    return new String(
        new char[] {
          POSSIBLE_KID_CHARACTERS[secureRandom.nextInt(POSSIBLE_KID_CHARACTERS.length)],
          POSSIBLE_KID_CHARACTERS[secureRandom.nextInt(POSSIBLE_KID_CHARACTERS.length)],
          POSSIBLE_KID_CHARACTERS[secureRandom.nextInt(POSSIBLE_KID_CHARACTERS.length)],
          POSSIBLE_KID_CHARACTERS[secureRandom.nextInt(POSSIBLE_KID_CHARACTERS.length)]
        });
  }
  ;

  @PostConstruct
  public void init() {

    jsonWebKeySetFlux =
        Flux.generate(
                (Consumer<SynchronousSink<KeyPair>>)
                    synchronousSink -> {
                      final var keyPair = keyPairGenerator.generateKeyPair();
                      synchronousSink.next(keyPair);
                    })
            .map(this::makeJwksFromJavaCryptoKeyPair);
  }

  /** Provides a flux of JSON web keys. */
  public Flux<JsonWebKeySet> jsonWebKeyPairs() {

    return jsonWebKeySetFlux;
  }

  private JsonWebKeySet makeJwksFromJavaCryptoKeyPair(KeyPair keyPair) {

    try {
      final var privateKey = keyPair.getPrivate();
      final var publicKey = (RSAPublicKey) keyPair.getPublic();

      final var jwks = new JsonWebKeySet();
      final var jwkPublic = JsonWebKey.Factory.newJwk(publicKey);
      jwkPublic.setKeyId(generateKid());
      jwkPublic.setUse("sig");
      jwkPublic.setAlgorithm(AlgorithmIdentifiers.RSA_USING_SHA256);

      jwks.addJsonWebKey(jwkPublic);
      jwks.addJsonWebKey(JsonWebKey.Factory.newJwk(privateKey));
      return jwks;
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }
}
