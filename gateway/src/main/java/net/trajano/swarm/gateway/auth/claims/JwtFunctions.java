package net.trajano.swarm.gateway.auth.claims;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.Key;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import lombok.AccessLevel;
import lombok.Data;
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
      if (l > 1000) {
        log.error("Signature generation time {}ms > 1000ms ", l);
      } else if (l > 500) {
        log.warn("Signature generation time {}ms > 500ms ", l);
      }
    }
  }

  @Data
  private static class JwtHeader {
    private String kid;
    private String alg = "RS256";
  }

  /**
   * This signs but only stores the key ID in the JOSE header.
   *
   * @param jwks jwks
   * @param payload payload
   * @return
   */
  public static String refreshSign(JsonWebKeySet jwks, String payload) {

    final String signed = sign(jwks, payload);
    final String jwtHeader = signed.substring(0, signed.indexOf('.'));
    try {
      final var header =
          new ObjectMapper().readValue(Base64.getUrlDecoder().decode(jwtHeader), JwtHeader.class);
      return header.getKid() + signed.substring(signed.indexOf('.'));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  private static Key getSigningKeyFromJwks(JsonWebKeySet jwks) {

    return jwks.getJsonWebKeys().stream()
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