package net.trajano.swarm.jwksprovider;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.function.Consumer;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveSetOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

@Service
@RequiredArgsConstructor
public class JwksRedisPopulator {

  public static final String RSA = "RSA";

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private SecureRandom secureRandom;

  private final ReactiveStringRedisTemplate redisTemplate;

  private KeyPairGenerator keyPairGenerator;

  private Disposable subscription;

  private Mono<List<Long>> generateAndStoreSigningKeysForBlock(final String signingkeyBlock) {

    final ReactiveSetOperations<String, String> setOps = redisTemplate.opsForSet();
    return generateKeyPairs()
        .take(authProperties.getSigningKeysPerBlock())
        .map(JsonWebKeySet::toJson)
        .flatMap(keyPairJwks -> setOps.add(signingkeyBlock, keyPairJwks))
        .collectList();
  }

  private Flux<JsonWebKeySet> generateKeyPairs() {

    return Flux.generate(
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
              // 5-character
              // base64 encoded
              // string which gives enough space to prevent duplicates, should there be a duplicate
              // it just
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
                return Mono.just(jwks);
              } catch (JoseException e) {
                return Mono.error(e);
              }
            });
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void initializeCryptoThenStart() {

    try {
      keyPairGenerator = KeyPairGenerator.getInstance(RSA);
      keyPairGenerator.initialize(2048);
      secureRandom = SecureRandom.getInstanceStrong();
      start();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private Mono<String> populateRedis(Instant ignored) {

    final Mono<Tuple2<String, Integer>> keyAndIndexToPopulate =
        redisTemplate
            .hasKey(redisKeyBlocks.currentSigningRedisKey())
            .flatMap(
                exists ->
                    Boolean.TRUE.equals(exists)
                        ? Mono.empty()
                        : Mono.just(Tuples.of(redisKeyBlocks.currentSigningRedisKey(), 0)))
            .switchIfEmpty(
                redisTemplate
                    .hasKey(redisKeyBlocks.nextSigningRedisKey())
                    .flatMap(
                        exists ->
                            Boolean.TRUE.equals(exists)
                                ? Mono.empty()
                                : Mono.just(Tuples.of(redisKeyBlocks.nextSigningRedisKey(), 1))));

    return keyAndIndexToPopulate
        .flatMap(t -> generateAndStoreSigningKeysForBlock(t.getT1()).thenReturn(t))
        .flatMap(
            t ->
                redisTemplate
                    .expireAt(
                        t.getT1(),
                        redisKeyBlocks.startingInstantForSigningKeyTimeBlock(
                            Instant.now(), t.getT2() + 2))
                    .thenReturn(t))
        .map(Tuple2::getT1);
  }

  public void start() {

    subscription =
        Mono.fromCallable(Instant::now)
            .delayElement(Duration.ofSeconds(10))
            .repeat()
            .flatMap(this::populateRedis)
            .subscribe();
  }

  @PreDestroy
  @SuppressWarnings("unused")
  public void stop() {

    subscription.dispose();
  }
}
