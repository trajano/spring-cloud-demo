package net.trajano.swarm.jwksprovider.redis;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.data.redis.connection.DataType;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class UserSessionCleaner {

  private final AuthProperties authProperties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final ReactiveStringRedisTemplate redisTemplate;

  /**
   * Removes user sessions that do not have an expiration and is older than a minute.
   *
   * @return void
   */
  public Mono<Void> cleanUserSessionsThatDoNotHaveExpiration() {

    final var hashOps = redisTemplate.<String, String>opsForHash();
    return redisTemplate
        .scan(
            ScanOptions.scanOptions()
                .type(DataType.HASH)
                .match(redisKeyBlocks.forAllUserSessions())
                .build())
        .flatMap(key -> redisTemplate.getExpire(key).filter(Duration::isZero).map(ignored -> key))
        .flatMap(
            key ->
                hashOps
                    .get(key, "issuedOn")
                    .map(Instant::parse)
                    .filter(issuedOn -> issuedOn.isBefore(Instant.now().minusSeconds(60)))
                    .map(ignored -> key))
        .flatMap(redisTemplate::delete)
        .then();
  }
}
