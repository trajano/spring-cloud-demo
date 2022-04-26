package net.trajano.swarm.gateway.auth.simple;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

/**
 * There's a few redis keys that are used.
 * <p>
 * 1. Symettric keys
 */
@RequiredArgsConstructor
public class RedisAuthCache {

    private KeyGenerator keyGenerator;

    private SecureRandom secureRandom;

    public Mono<OAuthTokenResponse> buildOAuthTokenWithUsername(String username, final int accessTokenExpiresInSeconds) {

        var jtiMono = Mono.fromCallable(UUID::randomUUID)
                .map(UUID::toString);

        var secretKeyMono = secretKey(jtiMono, accessTokenExpiresInSeconds);
        var refreshTokenMono = generateRefreshToken();


        return Mono.zip(jtiMono, refreshTokenMono).map(t2 -> {
            final var operationResponse = new OAuthTokenResponse();
            operationResponse.setOk(true);

            operationResponse.setRefreshToken(t2.getT2());
            operationResponse.setExpiresIn(accessTokenExpiresInSeconds);
            return operationResponse;

        });

    }

    @PostConstruct
    @SneakyThrows
    public void initializeCrypto() {

        keyGenerator = KeyGenerator.getInstance("AES");
        secureRandom = SecureRandom.getInstanceStrong();
        keyGenerator.init(256, secureRandom);
        System.out.println(secureRandom);

    }

    private Mono<String> generateRefreshToken() {

        System.out.println("!" + secureRandom);
        return Mono.fromCallable(() -> {
            System.out.println("!!" + secureRandom);
            byte[] bytes = new byte[32];
            secureRandom.nextBytes(bytes);
            return Base64.getUrlEncoder().encodeToString(bytes);
        });

    }

    /**
     * Only allow letters and numbers, no symbols. It makes it easier to copy and
     * paste for testing.
     */
    private static final char[] ALLOWED_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray();

    private final ReactiveStringRedisTemplate redisTemplate;

    private final SimpleAuthServiceProperties simpleAuthServiceProperties;


    /**
     * This creates a symettricKey keyed on JTI.  It first checks if there is one and if there is it will update its expiration so it is shifted.
     * If one does not exist it will create a new one with the desired expiration
     */
    private Mono<SecretKey> secretKey(Mono<String> jtiMono, int expiresInSeconds) {

        return jtiMono.flatMap(jti-> {
            final var urlDecoder = Base64.getUrlDecoder();
            var ops = redisTemplate.opsForValue();
            final var redisKey = "%s:::symmetricKeys:::%s".formatted(simpleAuthServiceProperties, jti);
            return ops.getAndExpire(redisKey, Duration.ofSeconds(expiresInSeconds))
                    .switchIfEmpty(Mono.defer(() -> {
                        final var secretKey = keyGenerator.generateKey();
                        final var encoded = secretKey.getEncoded();
                        final var e = Base64.getUrlEncoder().encodeToString(encoded);
                        return ops.setIfAbsent(redisKey, e, Duration.ofSeconds(expiresInSeconds))
                                .flatMap(result -> {
                                    if (result) {
                                        return Mono.just(e);
                                    } else {
                                        return Mono.error(IllegalStateException::new);
                                    }
                                });
                    }))
                    .map(urlDecoder::decode)
                    .map(bytes ->
                            new SecretKeySpec(bytes, "AES")
                    );
        });
    }

}
