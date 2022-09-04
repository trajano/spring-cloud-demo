package net.trajano.swarm.jwksprovider.database;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.common.dao.BlockSigningKeys;
import net.trajano.swarm.gateway.common.domain.BlockSigningKey;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.jwksprovider.Blocks;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "auth", name = "datasource", havingValue = "DATABASE")
public class DatabaseBlocksController {

  private final BlockSigningKeys blockSigningKeys;
  private final RedisKeyBlocks redisKeyBlocks;

  private Flux<String> getKeyPairs(final Instant epochSecondsBlockInstant) {
    return blockSigningKeys
        .findAllByEpochSecondsBlock(epochSecondsBlockInstant)
        .map(BlockSigningKey::keyId);
  }

  @GetMapping("/db")
  Mono<Blocks> blocks() {

    return Mono.zip(
            getKeyPairs(redisKeyBlocks.startingInstantForSigningKeyTimeBlock(Instant.now(), -1))
                .collectList(),
            getKeyPairs(redisKeyBlocks.startingInstantForSigningKeyTimeBlock(Instant.now(), 0))
                .collectList(),
            getKeyPairs(redisKeyBlocks.startingInstantForSigningKeyTimeBlock(Instant.now(), 1))
                .collectList())
        .map(
            t ->
                Blocks.builder()
                    .previousSigningRedisKey(
                        redisKeyBlocks
                            .startingInstantForSigningKeyTimeBlock(Instant.now(), -1)
                            .toString())
                    .hasCurrentSigningRedisKey(t.getT1())
                    .currentSigningRedisKey(
                        redisKeyBlocks
                            .startingInstantForSigningKeyTimeBlock(Instant.now(), 0)
                            .toString())
                    .hasCurrentSigningRedisKey(t.getT2())
                    .nextSigningRedisKey(
                        redisKeyBlocks
                            .startingInstantForSigningKeyTimeBlock(Instant.now(), 1)
                            .toString())
                    .hasNextSigningRedisKey(t.getT3())
                    .build());
  }
}
