package net.trajano.swarm.gateway.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jose4j.jwt.JwtClaims;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentityServiceResponse {

  /** Claims that will be passed back to the client/ */
  private JwtClaims claims;

  /**
   * Claims that are not passed back to the client, but are associated with the refresh token in
   * order to refresh access to the backend. The secret claims will have it's JTI modified to match
   * the claims during processing.
   */
  private JwtClaims secretClaims;

  private boolean ok = true;
  private int penaltyDelayInSeconds = 0;
}
