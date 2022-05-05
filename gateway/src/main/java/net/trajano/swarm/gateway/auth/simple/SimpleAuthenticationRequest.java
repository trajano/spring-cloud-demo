package net.trajano.swarm.gateway.auth.simple;

import lombok.Data;

@Data
public class SimpleAuthenticationRequest {

  /** Username of the person. */
  private String username;

  /** Indicates that the user is to be authenticated successfully. */
  private boolean authenticated;

  /** Allow request to alter the access token expiration (for testing) */
  private int accessTokenExpiresInMillis = 0;
  /** Allow request to alter the refresh token expiration (for testing) */
  private int refreshTokenExpiresInMillis = 0;
}
