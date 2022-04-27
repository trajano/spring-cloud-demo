package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.jose4j.jwe.ContentEncryptionAlgorithmIdentifiers.AES_256_CBC_HMAC_SHA_512;
import static org.jose4j.jwe.ContentEncryptionAlgorithmIdentifiers.AES_256_GCM;
import static org.jose4j.jwe.KeyManagementAlgorithmIdentifiers.DIRECT;
import static org.jose4j.jwe.KeyManagementAlgorithmIdentifiers.RSA_OAEP_256;

import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.UUID;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import net.trajano.swarm.gateway.auth.simple.ZlibStringCompression;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwe.JsonWebEncryption;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.NumericDate;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/** This primarily tests JOSE4J. */
class CryptoTests {

  private static KeyPair encryptionKeyPair;

  private static KeyPair signatureKeyPair;

  private static SecretKey secretKey;

  @BeforeAll
  static void setupKeys() throws Exception {

    final var keyPairGenerator = KeyPairGenerator.getInstance("RSA");
    keyPairGenerator.initialize(4096);
    encryptionKeyPair = keyPairGenerator.generateKeyPair();
    signatureKeyPair = keyPairGenerator.generateKeyPair();

    final var keyGenerator = KeyGenerator.getInstance("AES");
    keyGenerator.init(256, SecureRandom.getInstanceStrong());
    secretKey = keyGenerator.generateKey();
  }

  JwtClaims buildTestClaims() {
    JwtClaims claims = new JwtClaims();
    claims.setJwtId(UUID.randomUUID().toString());
    claims.setIssuer("https://trajano.net");
    claims.setSubject("MEMEFASOSOFAMIRE@https://trajano.net");
    claims.setAudience("ABC", "123", "DO", "RE", "MI");
    final var expiration = NumericDate.now();
    expiration.addSeconds(2000);
    claims.setExpirationTime(expiration);
    return claims;
  }
  /**
   * <a
   * href="https://jose.ietf.narkive.com/elJelOWB/would-it-be-possible-to-add-deflate-compression-for-the-jwt-payload-into-the-jwt-jws-jwe-specs">JWS
   * does not support compression as part of the spec</a>. This is an experiment to see if the
   * savings due to compression are significant. The process is compress-then-sign this allows
   * structural verification without the cost of decompression first.
   *
   * @throws Exception
   */
  @Test
  void jwsCompression() throws Exception {

    var claims = buildTestClaims();

    final var jws = new JsonWebSignature();
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    jws.setPayloadBytes(ZlibStringCompression.compressToBytes(claims.toJson()));
    jws.setKey(signatureKeyPair.getPrivate());
    var jwsCompactSerialization = jws.getCompactSerialization();

    System.out.println(jwsCompactSerialization.length() + " " + jwsCompactSerialization);

    final var receiverJws = new JsonWebSignature();
    receiverJws.setCompactSerialization(jwsCompactSerialization);
    receiverJws.setKey(signatureKeyPair.getPublic());
    assertThat(receiverJws.verifySignature()).isTrue();

    final var claimsFromJwt =
        JwtClaims.parse(ZlibStringCompression.decompressUtf8(receiverJws.getPayloadBytes()));
    assertThat(claimsFromJwt.toJson()).isEqualTo(claims.toJson());
  }

  @Test
  void toJwtAndBack() throws Exception {
    var claims = buildTestClaims();

    final var jws = new JsonWebSignature();
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    jws.setPayload(claims.toJson());
    jws.setKey(signatureKeyPair.getPrivate());
    var jwsCompactSerialization = jws.getCompactSerialization();

    System.out.println(jwsCompactSerialization.length() + " " + jwsCompactSerialization);

    final var jwe = new JsonWebEncryption();
    jwe.setAlgorithmHeaderValue(RSA_OAEP_256);
    jwe.setEncryptionMethodHeaderParameter(AES_256_CBC_HMAC_SHA_512);
    jwe.setKey(encryptionKeyPair.getPublic());
    jwe.setContentTypeHeaderValue("JWT");
    jwe.setPlaintext(jwsCompactSerialization);
    jwe.enableDefaultCompression();
    final var jweCompactSerialization = jwe.getCompactSerialization();

    System.out.println(jweCompactSerialization.length() + " " + jweCompactSerialization);

    final var receiverJwe = new JsonWebEncryption();
    receiverJwe.setCompactSerialization(jweCompactSerialization);
    receiverJwe.setKey(encryptionKeyPair.getPrivate());

    assertThat(receiverJwe.getPlaintextString()).isEqualTo(jwsCompactSerialization);

    final var receiverJws = new JsonWebSignature();
    receiverJws.setCompactSerialization(receiverJwe.getPlaintextString());
    receiverJws.setKey(signatureKeyPair.getPublic());
    assertThat(receiverJws.verifySignature()).isTrue();

    final var claimsFromJwt = JwtClaims.parse(receiverJws.getPayload());
    assertThat(claimsFromJwt.toJson()).isEqualTo(claims.toJson());
  }

  @Test
  void jwtConsumer() throws Exception {

    JwtClaims claims = new JwtClaims();
    claims.setJwtId("123");
    claims.setIssuer("https://trajano.net");
    claims.setExpirationTimeMinutesInTheFuture(20.0001f);
    claims.setSubject("ME");

    final var jws = new JsonWebSignature();
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    jws.setPayload(claims.toJson());
    jws.setKey(signatureKeyPair.getPrivate());
    var jwsCompactSerialization = jws.getCompactSerialization();

    System.out.println(jwsCompactSerialization.length() + " " + jwsCompactSerialization);

    final var jwe = new JsonWebEncryption();
    jwe.setAlgorithmHeaderValue(RSA_OAEP_256);
    jwe.setEncryptionMethodHeaderParameter(AES_256_CBC_HMAC_SHA_512);
    jwe.setKey(encryptionKeyPair.getPublic());
    jwe.setContentTypeHeaderValue("JWT");
    jwe.setPlaintext(jwsCompactSerialization);
    jwe.enableDefaultCompression();
    final var jweCompactSerialization = jwe.getCompactSerialization();
    System.out.println(jweCompactSerialization.length() + " " + jweCompactSerialization);

    final var consumer =
        new JwtConsumerBuilder()
            .setRequireJwtId()
            .setRequireExpirationTime()
            .setRequireSubject()
            .setJweAlgorithmConstraints(AlgorithmConstraints.ConstraintType.PERMIT, RSA_OAEP_256)
            .setJweContentEncryptionAlgorithmConstraints(
                AlgorithmConstraints.ConstraintType.PERMIT, AES_256_CBC_HMAC_SHA_512)
            .setDecryptionKey(encryptionKeyPair.getPrivate())
            .setVerificationKey(signatureKeyPair.getPublic())
            .build();

    final var claimsFromJwt = consumer.processToClaims(jweCompactSerialization);
    assertThat(claimsFromJwt.toJson()).isEqualTo(claims.toJson());
  }

  @Test
  void jwtConsumerSecretKey() throws Exception {

    JwtClaims claims = new JwtClaims();
    claims.setJwtId("123");
    claims.setIssuer("https://trajano.net");
    claims.setExpirationTimeMinutesInTheFuture(20.0001f);
    claims.setSubject("ME");

    final var jws = new JsonWebSignature();
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    jws.setPayload(claims.toJson());
    jws.setKey(signatureKeyPair.getPrivate());
    var jwsCompactSerialization = jws.getCompactSerialization();

    final var jwe = new JsonWebEncryption();
    jwe.setAlgorithmHeaderValue(DIRECT);
    jwe.setEncryptionMethodHeaderParameter(AES_256_GCM);
    jwe.setKey(secretKey);
    jwe.setContentTypeHeaderValue("JWT");
    jwe.setPlaintext(jwsCompactSerialization);
    jwe.enableDefaultCompression();
    final var jweCompactSerialization = jwe.getCompactSerialization();

    System.out.println(jweCompactSerialization.length() + " " + jweCompactSerialization);

    final var consumer =
        new JwtConsumerBuilder()
            .setRequireJwtId()
            .setRequireExpirationTime()
            .setRequireSubject()
            .setJweAlgorithmConstraints(AlgorithmConstraints.ConstraintType.PERMIT, DIRECT)
            .setJweContentEncryptionAlgorithmConstraints(
                AlgorithmConstraints.ConstraintType.PERMIT, AES_256_GCM)
            .setDecryptionKey(secretKey)
            .setVerificationKey(signatureKeyPair.getPublic())
            .build();

    final var claimsFromJwt = consumer.processToClaims(jweCompactSerialization);
    assertThat(claimsFromJwt.toJson()).isEqualTo(claims.toJson());
  }

  @Test
  void jwksEncodedPrivateKey() throws Exception {

    byte[] encodedPrivateKey = signatureKeyPair.getPrivate().getEncoded();
    var privateKey =
        KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(encodedPrivateKey));

    final var signJws = new JsonWebSignature();
    signJws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    signJws.setKey(privateKey);
    signJws.setPayload("TEST");
    signJws.sign();

    final var jwt = signJws.getCompactSerialization();

    final var verifyJws = new JsonWebSignature();
    verifyJws.setCompactSerialization(jwt);
    verifyJws.setKey(signatureKeyPair.getPublic());
    assertThat(verifyJws.verifySignature()).isTrue();

    final var jwkPublic = JsonWebKey.Factory.newJwk(signatureKeyPair.getPublic());
    var publicKeyFromJwk = (PublicKey) jwkPublic.getKey();

    verifyJws.setKey(publicKeyFromJwk);
    assertThat(verifyJws.verifySignature()).isTrue();

    final var jwkPublicJson = jwkPublic.toJson();
    final var jsonWebKeyFromJson = JsonWebKey.Factory.newJwk(jwkPublicJson);

    verifyJws.setKey(jsonWebKeyFromJson.getKey());
    assertThat(verifyJws.verifySignature()).isTrue();
  }

  @Test
  void jwksGeneratedPrivateKey() throws Exception {

    final var signJws = new JsonWebSignature();
    signJws.setAlgorithmHeaderValue(AlgorithmIdentifiers.RSA_USING_SHA512);
    signJws.setKey(signatureKeyPair.getPrivate());
    signJws.setPayload("TEST");
    signJws.sign();

    final var jwt = signJws.getCompactSerialization();

    final var verifyJws = new JsonWebSignature();
    verifyJws.setCompactSerialization(jwt);
    verifyJws.setKey(signatureKeyPair.getPublic());
    assertThat(verifyJws.verifySignature()).isTrue();

    final var jwkPublic = JsonWebKey.Factory.newJwk(signatureKeyPair.getPublic());
    var publicKeyFromJwk = (PublicKey) jwkPublic.getKey();

    verifyJws.setKey(publicKeyFromJwk);
    assertThat(verifyJws.verifySignature()).isTrue();

    final var jwkPublicJson = jwkPublic.toJson();
    final var jsonWebKeyFromJson = JsonWebKey.Factory.newJwk(jwkPublicJson);

    verifyJws.setKey(jsonWebKeyFromJson.getKey());
    assertThat(verifyJws.verifySignature()).isTrue();
  }
}
