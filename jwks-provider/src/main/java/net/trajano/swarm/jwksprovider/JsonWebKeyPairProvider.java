package net.trajano.swarm.jwksprovider;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.function.Consumer;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.domain.JsonWebKeyPair;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.lang.JoseException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;

@Service
@RequiredArgsConstructor
public class JsonWebKeyPairProvider {

  public static final String RSA = "RSA";

  private Flux<JsonWebKeyPair> jsonWebKeySetFlux;
  private final AuthProperties authProperties;

  @PostConstruct
  public void init() throws NoSuchAlgorithmException {

    final var keyPairGenerator = KeyPairGenerator.getInstance(RSA);
    keyPairGenerator.initialize(2048);
    final var secureRandom = SecureRandom.getInstanceStrong();

    jsonWebKeySetFlux =
        Flux.generate(
                (Consumer<SynchronousSink<KeyPair>>)
                    synchronousSink -> {
                      final var keyPair = keyPairGenerator.generateKeyPair();
                      synchronousSink.next(keyPair);
                    })
            .flatMap(
                keyPair -> {
                  final var privateKey = keyPair.getPrivate();
                  final var publicKey = (RSAPublicKey) keyPair.getPublic();

                  // There is no need for the KID to be too long.  3-bytes translates to an 4 or
                  // 5-character base64 encoded
                  // string which gives enough space to prevent duplicates, should there be a
                  // duplicate it just
                  // reduces the amount of selectable keys, but there will at least be one.
                  final var kidBytes = new byte[3];
                  secureRandom.nextBytes(kidBytes);
                  final var kid = Base64.getUrlEncoder().withoutPadding().encodeToString(kidBytes);

                  final var jwks = new JsonWebKeySet();
                  try {
                    final var jwkPublic = JsonWebKey.Factory.newJwk(publicKey);
                    jwkPublic.setKeyId(kid);
                    jwkPublic.setUse("sig");
                    jwkPublic.setAlgorithm(AlgorithmIdentifiers.RSA_USING_SHA256);

                    jwks.addJsonWebKey(jwkPublic);
                    jwks.addJsonWebKey(JsonWebKey.Factory.newJwk(privateKey));
                    return Mono.just(
                        new JsonWebKeyPair(
                            kid,
                            jwks.toJson(),
                            Instant.now()
                                .plusSeconds(authProperties.getSigningKeyExpiresInSeconds())));
                  } catch (JoseException e) {
                    return Mono.error(e);
                  }
                });
  }

  /** Provides a flux of JSON web keys. */
  public Flux<JsonWebKeyPair> jsonWebKeyPairs() {

    return jsonWebKeySetFlux;
  }
}
