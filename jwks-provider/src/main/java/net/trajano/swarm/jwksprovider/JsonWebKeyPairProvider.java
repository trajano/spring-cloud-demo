package net.trajano.swarm.jwksprovider;

import java.security.KeyPair;
import java.security.SecureRandom;
import java.util.function.Consumer;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.jose4j.jwk.EcJwkGenerator;
import org.jose4j.jwk.EllipticCurveJsonWebKey;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.keys.EllipticCurves;
import org.jose4j.lang.JoseException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SynchronousSink;

@Service
@RequiredArgsConstructor
public class JsonWebKeyPairProvider {

  /** Possible characters for the KID */
  private static final char[] POSSIBLE_KID_CHARACTERS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray();

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
                (Consumer<SynchronousSink<EllipticCurveJsonWebKey>>)
                    synchronousSink -> {
                      try {
                        synchronousSink.next(
                            EcJwkGenerator.generateJwk(EllipticCurves.P256, null, secureRandom));
                      } catch (JoseException e) {
                        synchronousSink.error(e);
                      }
                    })
            .map(
                webKeyPair ->
                    new KeyPair(webKeyPair.getECPublicKey(), webKeyPair.getEcPrivateKey()))
            .map(this::makeJwksFromJavaCryptoKeyPair);
  }

  /** Provides a flux of JSON web keys. */
  public Flux<JsonWebKeySet> jsonWebKeyPairs() {

    return jsonWebKeySetFlux;
  }

  private JsonWebKeySet makeJwksFromJavaCryptoKeyPair(KeyPair keyPair) {

    try {
      final var privateKey = keyPair.getPrivate();
      final var publicKey = keyPair.getPublic();

      final var jwks = new JsonWebKeySet();
      final var jwkPublic = JsonWebKey.Factory.newJwk(publicKey);
      jwkPublic.setKeyId(generateKid());
      jwkPublic.setUse("sig");
      jwkPublic.setAlgorithm(AlgorithmIdentifiers.ECDSA_USING_P256_CURVE_AND_SHA256);

      jwks.addJsonWebKey(jwkPublic);
      jwks.addJsonWebKey(JsonWebKey.Factory.newJwk(privateKey));
      return jwks;
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }
}
