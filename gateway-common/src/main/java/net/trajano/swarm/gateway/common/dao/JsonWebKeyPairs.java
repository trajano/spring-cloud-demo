package net.trajano.swarm.gateway.common.dao;

import java.time.Instant;
import net.trajano.swarm.gateway.common.domain.JsonWebKeyPair;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface JsonWebKeyPairs extends ReactiveCrudRepository<JsonWebKeyPair, String> {

  /**
   * Removes key pairs where the key pair has expired on the parameter
   *
   * @param on processing instant
   */
  @Modifying
  @Query("delete from json_web_key_pair where expires_on <= :on")
  Mono<Void> deleteExpiredOn(Instant on);
}
