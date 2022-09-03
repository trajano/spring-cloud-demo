package net.trajano.swarm.gateway.redis;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import lombok.With;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwt.JwtClaims;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

@RedisHash("${auth.redis-prefix}:user-sessions")
@Data
@Builder
@With
public class UserSession {

  /** Sessions are keyed to a JWT ID which is a UUID. */
  @Id private UUID jwtId;

  private JwtClaims secretClaims;

  private Instant issuedOn;

  private JsonWebKey verificationJwk;

  @TimeToLive private Long ttl;
}
