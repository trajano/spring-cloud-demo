package net.trajano.swarm.gateway.common.dao;

import java.time.Instant;
import net.trajano.swarm.gateway.common.domain.AccessToken;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface AccessTokens extends ReactiveCrudRepository<AccessToken, String> {

  Mono<Void> deleteByJti(String jti);

  /**
   * Removes tokens that are expired on the parameter
   *
   * @param on processing instant
   */
  @Modifying
  @Query("delete from access_token where expires_on <= :on")
  Mono<Void> deleteExpiredOn(Instant on);

  @Query("select count(*) from access_token where jti = :jti and expires_on >= :now")
  Mono<Long> countByJtiAndNotExpired(String jti, Instant now);

  default Mono<Boolean> existsByJtiAndNotExpired(String jti, Instant now) {
    return countByJtiAndNotExpired(jti, now).map(c -> c > 0);
  }
}
