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

  /**
   * JWT string for the access token. This is to allow resending the data when refresh was called
   * too soon.
   */
  private String accessToken;

  /** Instant when the access token will expire. */
  private Instant accessTokenExpiresAt;

  /** Instant when the last access token as issued. */
  private Instant accessTokenIssuedOn;

  private Instant issuedOn;

  /** Sessions are keyed to a JWT ID which is a UUID. */
  @Id private UUID jwtId;

  /**
   * JWT string for the refresh token. This is to allow resending the data when refresh was called
   * too soon.
   */
  private String refreshToken;

  private JwtClaims secretClaims;

  /**
   * Client ID associated with the session. This will be used to verify that the client can access
   * via the {@code aud} claim.
   */
  private String clientId;

  @TimeToLive private Long ttl;

  private JsonWebKey verificationJwk;
}
