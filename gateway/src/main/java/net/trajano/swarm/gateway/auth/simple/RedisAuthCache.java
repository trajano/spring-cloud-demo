package net.trajano.swarm.gateway.auth.simple;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.data.redis.core.ReactiveHashOperations;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import javax.crypto.KeyGenerator;
import java.security.SecureRandom;

/**
 * There's a few redis keys that are used.
 * <p>
 * 1. Symettric keys
 */
@RequiredArgsConstructor
public class RedisAuthCache {

    private KeyGenerator keyGenerator;

    @PostConstruct
    @SneakyThrows
    public void initializeCrypto() {

        keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(256, SecureRandom.getInstanceStrong());

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
    public void symetricKey(String jti, int expiresInSeconds) {

        ReactiveHashOperations<String, String, byte[]> opsForHash = redisTemplate.opsForHash();
        opsForHash.get(simpleAuthServiceProperties + "symmetricKeys", jti)
                .switchIfEmpty(Mono.fromCallable(() -> {
                    final var secretKey = keyGenerator.generateKey();
                    final var encoded = secretKey.getEncoded();
                    opsForHash.putIfAbsent(simpleAuthServiceProperties + "symmetricKeys", jti, encoded);

                    return encoded;
                }));
        //redisTemplate.expireAt()
    }

}
