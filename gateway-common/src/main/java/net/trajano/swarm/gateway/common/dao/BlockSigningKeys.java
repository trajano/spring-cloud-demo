package net.trajano.swarm.gateway.common.dao;

import java.util.UUID;
import net.trajano.swarm.gateway.common.domain.BlockSigningKey;
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
  @Query("delete from BlockSigningKey where epochSecondsBlock <= :epochSecondsBlock")
  Mono<Void> deleteBlocksEqualOrOlderThanBlock(long epochSecondsBlock);

  @Query(
      "select KeyPair.jwk from KeyPair, BlockSigningKey where KeyPair.keyId = BlockSigningKey.keyId and epochSecondsBlock = :epochSecondsBlock")
  Flux<String> jwksForBlock(long epochSecondsBlock);
}
