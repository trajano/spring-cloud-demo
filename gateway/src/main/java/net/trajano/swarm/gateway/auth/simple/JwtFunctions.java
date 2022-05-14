package net.trajano.swarm.gateway.auth.simple;

import java.security.Key;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.lang.JoseException;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Slf4j
public final class JwtFunctions {

  public static final String ALGORITHM_RSA = "RSA";

  private static KeyFactory rsaKeyFactory;

  static {
    try {
      rsaKeyFactory = KeyFactory.getInstance(ALGORITHM_RSA);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public static JsonWebKeySet toJwks(String s) {

    try {
      return (new JsonWebKeySet(s));
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  public static String sign(JsonWebKeySet jwks, String payload) {

    var start = System.currentTimeMillis();
    var signingKey = getSigningKeyFromJwks(jwks);
    var kid = getVerificationKeyIdFromJwks(jwks);
    final var jws = new JsonWebSignature();
    jws.setKeyIdHeaderValue(kid);
    jws.setPayload(payload);
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA256);
    jws.setKey(signingKey);
    try {
      jws.sign();
      return jws.getCompactSerialization();
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    } finally {
      final long l = System.currentTimeMillis() - start;
      if (l > 500) {
        log.error("Time " + l);
      }
    }
  }

  private static Key getSigningKeyFromJwks(JsonWebKeySet jwks) {

    return jwks.getJsonWebKeys().stream()
        .peek(System.out::println)
        .filter(jwk -> jwk.getKeyType().equals("oct"))
        .findAny()
        .map(JsonWebKey::getKey)
        .map(Key::getEncoded)
        .map(
            bytes -> {
              try {
                return rsaKeyFactory.generatePrivate(new PKCS8EncodedKeySpec(bytes));
              } catch (InvalidKeySpecException e) {
                throw new IllegalStateException(e);
              }
            })
        .orElseThrow();
  }

  private static String getVerificationKeyIdFromJwks(JsonWebKeySet jwks) {

    return jwks.getJsonWebKeys().stream()
        .filter(jwk -> jwk.getKeyType().equals(ALGORITHM_RSA))
        .findAny()
        .map(JsonWebKey::getKeyId)
        .orElseThrow();
  }
}
