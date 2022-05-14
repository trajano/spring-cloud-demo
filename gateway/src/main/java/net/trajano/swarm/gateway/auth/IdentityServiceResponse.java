package net.trajano.swarm.gateway.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jose4j.jwt.JwtClaims;
import org.springframework.lang.Nullable;

/** This is data that is provided by the backend system. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentityServiceResponse {

  /**
   * Claims that will be passed back to the client. The claims may optionally specify the expiration
   * which will be used to override th access token expiration. The access token expiration override
   * should be less than the auth gateway values. This adjustment allows for faster functional
   * testing with smaller values.
   */
  @Nullable private JwtClaims claims;

  /**
   * This indicates whether the response is successful, if not the claims are expected to be null.
   */
  @Builder.Default private boolean ok = true;

  @Builder.Default private int penaltyDelayInSeconds = 0;

  /**
   * Claims that are not passed back to the client, but are associated with the refresh token in
   * order to refresh access to the backend. The secret claims will have it's JTI modified to match
   * the claims during processing.
   *
   * <p>The claims may optionally specify the expiration which will be used to override th refresh
   * token expiration. The refresh token expiration override should be less than the auth gateway
   * values. This adjustment allows for faster functional testing with smaller values.
   */
  @Nullable private JwtClaims secretClaims;
}
