package net.trajano.swarm.gateway.common.dao;

import java.time.Instant;
import net.trajano.swarm.gateway.common.domain.AccessToken;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface AccessTokens extends ReactiveCrudRepository<AccessToken, String> {

  /**
   * Removes key pairs where the key pair has expired on the parameter
   *
   * @param on processing instant
   */
  @Query("delete from AccessToken where expiresOn <= :on")
  Mono<Void> deleteExpiredOn(Instant on);
}
