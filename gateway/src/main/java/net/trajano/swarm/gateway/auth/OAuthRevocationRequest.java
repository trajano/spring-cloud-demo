package net.trajano.swarm.gateway.auth;

import lombok.Data;

@Data
public class OAuthRevocationRequest {

  /** Refresh token. */
  private String token;

  /**
   * Token type hint, should be refresh_token. Used non-conventional method due to limitation of
   * Spring. https://github.com/spring-projects/spring-framework/issues/18012
   */
  private String token_type_hint;
}
