package net.trajano.swarm.gateway.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.trajano.swarm.gateway.web.GatewayResponse;

@Data
@NoArgsConstructor
public class OAuthTokenResponse extends GatewayResponse {

  /** The access token. This is the JWT of the claims that's signed with a key. */
  @JsonProperty("access_token")
  private String accessToken;

  /** Number of seconds before the token expires in seconds. */
  @JsonProperty("expires_in")
  private int expiresIn;

  /**
   * The type of token this is, typically just the string {@code Bearer} and is the default value.
   */
  @JsonProperty("token_type")
  private String tokenType = "Bearer";

  /** The refresh token that would be used to generate a new the access token. */
  @JsonProperty("refresh_token")
  private String refreshToken;
}
