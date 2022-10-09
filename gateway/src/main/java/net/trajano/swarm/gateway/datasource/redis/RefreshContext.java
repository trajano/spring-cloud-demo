package net.trajano.swarm.gateway.datasource.redis;

import java.time.Instant;
import lombok.*;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;

@Data
@With
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RefreshContext {

  /** Signed access token. */
  private String accessToken;

  private JwtClaims accessTokenClaims;

  private Instant accessTokenExpiresAt;

  private JsonWebKeySet accessTokenSigningKeyPair;

  private String clientId;

  private IdentityServiceResponse identityServiceResponse;

  private String jwtId;

  private Instant now;

  /** Signed refresh token. */
  private String refreshToken;

  private JwtClaims refreshTokenClaims;

  private Instant refreshTokenExpiresAt;

  private JsonWebKeySet refreshTokenSigningKeyPair;

  private UserSession userSession;
}
