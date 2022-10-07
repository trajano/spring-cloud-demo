package net.trajano.swarm.gateway.auth.simple;

import java.net.URI;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimpleAuthenticationRequest {

  /** Username of the person. */
  private String username;

  /** Indicates that the user is to be authenticated successfully. */
  private boolean authenticated;

  /** Allow request to alter the access token expiration (for testing) */
  @Nullable private Integer accessTokenExpiresInMillis;
  /** Allow request to alter the refresh token expiration (for testing) */
  @Nullable private Integer refreshTokenExpiresInMillis;

  /** For OIDC login, this is the issuer. */
  private URI issuer;
  /** For OIDC login, this is the access token which should be a JWT. */
  private String accessToken;
}
