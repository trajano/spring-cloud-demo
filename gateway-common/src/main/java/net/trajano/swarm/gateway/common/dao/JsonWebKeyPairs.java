package net.trajano.swarm.gateway.common.dao;

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
  @Query(
      "delete from json_web_key_pair where key_id not in (select key_id from access_token union select key_id from refresh_token union select key_id from block_signing_key)")
  Mono<Void> deleteUnused();
}
