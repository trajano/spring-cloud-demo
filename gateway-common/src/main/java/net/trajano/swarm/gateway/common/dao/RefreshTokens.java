package net.trajano.swarm.gateway.common.dao;

import java.time.Instant;
import net.trajano.swarm.gateway.common.domain.RefreshToken;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface RefreshTokens extends ReactiveCrudRepository<RefreshToken, String> {

  /**
   * Removes tokens that are expired on the parameter
   *
   * @param on processing instant
   */
  @Modifying
  @Query("delete from refresh_token where expires_on <= :on")
  Mono<Void> deleteExpiredOn(Instant on);

  @Query("select refresh_token.* from refresh_token where jti = :jti and expires_on >= :now")
  Mono<RefreshToken> findByJtiAndNotExpired(String jti, Instant on);
}
