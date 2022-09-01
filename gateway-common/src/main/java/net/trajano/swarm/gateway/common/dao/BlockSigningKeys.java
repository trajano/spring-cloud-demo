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
      "select json_web_key_pair.jwk from json_web_key_pair, block_signing_key where json_web_key_pair.key_id = block_signing_key.key_id and (epoch_seconds_block = :epochSecondsBlock1 or epoch_seconds_block = :epochSecondsBlock2)")
  Flux<String> jwksForBlocks(long epochSecondsBlock1, long epochSecondsBlock2);

  default Flux<String> jwksForBlocks(Instant epochSecondsBlock1, Instant epochSecondsBlock2) {
    return jwksForBlocks(epochSecondsBlock1.getEpochSecond(), epochSecondsBlock2.getEpochSecond());
  }

  @Query(
      "select json_web_key_pair.jwk from json_web_key_pair, block_signing_key where json_web_key_pair.key_id = block_signing_key.key_id and epoch_seconds_block = :epochSecondsBlock")
  Flux<String> jwksForBlock(long epochSecondsBlock);

  /**
   * Get a set of JWKS for a single block. Primarily used to take a key pair for signing an access
   * token with the current epoch seconds block.
   *
   * @param epochSecondsBlock epoch seconds block
   * @return
   */
  default Flux<String> jwksForBlock(Instant epochSecondsBlock) {
    return jwksForBlock(epochSecondsBlock.getEpochSecond());
  }
}
