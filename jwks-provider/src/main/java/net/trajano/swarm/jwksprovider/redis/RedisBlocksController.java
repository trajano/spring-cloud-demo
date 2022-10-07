package net.trajano.swarm.jwksprovider.redis;

import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.Blocks;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RedisBlocksController {

  private final StringRedisTemplate redisTemplate;

  private final RedisKeyBlocks redisKeyBlocks;

  private Collection<String> getKeyPairs(final String redisKey) {
    final SetOperations<String, String> setOps = redisTemplate.opsForSet();
    if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {

      try (final var scan = setOps.scan(redisKey, ScanOptions.scanOptions().build())) {
        return scan.stream().toList();
      }
    } else {
      return List.of();
    }
  }

  private String getKid(String jwks) {

    try {
      return new JsonWebKeySet(jwks)
          .getJsonWebKeys().stream()
              .filter(jwk -> jwk.getKeyType().equals("EC"))
              .map(JsonWebKey::getKeyId)
              .findAny()
              .orElseThrow();
    } catch (JoseException e) {
      throw new IllegalStateException(e);
    }
  }

  @GetMapping("/redis")
  Blocks blocks() {

    final var key = redisKeyBlocks.previousSigningRedisKey();
    var l1 = getKeyPairs(key).stream().map(this::getKid).toList();
    var l2 =
        getKeyPairs(redisKeyBlocks.currentSigningRedisKey()).stream().map(this::getKid).toList();
    var l3 = getKeyPairs(redisKeyBlocks.nextSigningRedisKey()).stream().map(this::getKid).toList();
    return Blocks.builder()
        .previousSigningRedisKey(key)
        .previous(l1)
        .currentSigningRedisKey(redisKeyBlocks.currentSigningRedisKey())
        .current(l2)
        .nextSigningRedisKey(redisKeyBlocks.nextSigningRedisKey())
        .next(l3)
        .build();
  }
}
