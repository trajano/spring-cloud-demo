package net.trajano.swarm.gateway.auth.simple;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.redis.core.ReactiveHashOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class RedisFunctions {

    /**
     *
     * @param ops reactive hash operations
     * @param key redis key
     * @param map map to load
     * @return mono of boolean to indicate successful put
     * @param <R> redis key type
     * @param <K> hash key type
     * @param <V> hash value type
     */
    public static <R, K, V> Mono<Boolean> putIfAbsent(ReactiveHashOperations<R, K, V> ops, R key, Map<K, V> map) {

        return Flux.fromIterable(map.entrySet())
                .flatMap(entry -> ops.putIfAbsent(key, entry.getKey(), entry.getValue()))
                .filter(success -> success)
                .count()
                .map(count -> count == map.size());

    }

}
