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

  @Query("select count(*) from refresh_token where expires_on >= :now and jti = :jti")
  Mono<Long> countByJtiAndNotExpired(String jti, Instant now);

  default Mono<Boolean> existsByJtiAndNotExpired(String jti, Instant now) {
    return countByJtiAndNotExpired(jti, now).map(c -> c > 0);
  }

  @Query("select refresh_token.* from refresh_token where expires_on >= :now and jti = :jti")
  Mono<RefreshToken> findByJtiAndNotExpired(String jti, Instant on);

  @Query("select refresh_token.* from refresh_token where expires_on >= :now and token = :token")
  Mono<RefreshToken> findByTokenAndNotExpired(String token, Instant on);
}
