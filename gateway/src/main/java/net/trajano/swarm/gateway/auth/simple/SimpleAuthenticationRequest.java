package net.trajano.swarm.gateway.auth.simple;

import java.net.URI;
import lombok.Data;
import org.springframework.lang.Nullable;

@Data
public class SimpleAuthenticationRequest {

  /** Username of the person. */
  private String username;

  /** Indicates that the user is to be authenticated successfully. */
  private boolean authenticated;

  /** Allow request to alter the access token expiration (for testing) */
  @Nullable private Integer accessTokenExpiresInMillis;
  /** Allow request to alter the refresh token expiration (for testing) */
  @Nullable private Integer refreshTokenExpiresInMillis;

  private URI issuer;
  private String accessToken;
}
