package net.trajano.swarm.gateway.common.dao;

import java.time.Instant;
import java.util.UUID;
import net.trajano.swarm.gateway.common.domain.BlockSigningKey;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface BlockSigningKeys extends ReactiveCrudRepository<BlockSigningKey, UUID> {

  /**
   * Removes signing key blocks that are expired.
   *
   * @param epochSecondsBlock epoch seconds block
   */
  @Modifying
  @Query("delete from block_signing_key where epoch_seconds_block < :epochSecondsBlock")
  Mono<Void> deleteBlocksOlderThanBlock(long epochSecondsBlock);

  default Mono<Void> deleteBlocksOlderThanBlock(Instant currentEpochSecondsBlock) {
    return deleteBlocksOlderThanBlock(currentEpochSecondsBlock.getEpochSecond());
  }

  Flux<BlockSigningKey> findAllByEpochSecondsBlock(long epochSecondsBlock);

  default Flux<BlockSigningKey> findAllByEpochSecondsBlock(Instant epochSecondsBlock) {
    return findAllByEpochSecondsBlock(epochSecondsBlock.getEpochSecond());
  }

  @Query(
      "select KeyPair.jwk from KeyPair, BlockSigningKey where KeyPair.keyId = BlockSigningKey.keyId and epochSecondsBlock = :epochSecondsBlock")
  Flux<String> jwksForBlock(long epochSecondsBlock);
}
