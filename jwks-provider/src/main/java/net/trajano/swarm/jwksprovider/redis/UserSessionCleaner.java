package net.trajano.swarm.jwksprovider.redis;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.springframework.data.redis.connection.DataType;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserSessionCleaner {

  private final RedisKeyBlocks redisKeyBlocks;

  private final StringRedisTemplate redisTemplate;

  /** Removes user sessions that do not have an expiration and is older than a minute. */
  public void cleanUserSessionsThatDoNotHaveExpiration() {

    final var hashOps = redisTemplate.<String, String>opsForHash();

    try (var cursor =
            redisTemplate.scan(
                ScanOptions.scanOptions()
                    .type(DataType.HASH)
                    .match(redisKeyBlocks.forAllUserSessions())
                    .build());
        var stream = cursor.stream()) {

      stream
          .filter(key -> redisTemplate.getExpire(key) < 0)
          .filter(
              key -> {
                final var issuedOn = hashOps.get(key, "issuedOn");
                if (issuedOn == null) {
                  return false;
                }
                return Instant.parse(issuedOn).isBefore(Instant.now().minusSeconds(60));
              })
          .forEach(redisTemplate::delete);
    }
  }
}
