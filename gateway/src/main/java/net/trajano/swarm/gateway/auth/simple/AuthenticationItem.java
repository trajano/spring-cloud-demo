package net.trajano.swarm.gateway.auth.simple;

import java.util.HashMap;
import java.util.Map;
import lombok.*;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jwt.JwtClaims;

/** Rather than passing tuples this holds the data per stage */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@With
public class AuthenticationItem {

  private SimpleAuthenticationRequest authenticationRequest;
  private JsonWebKeySet jwks;
  private JwtClaims jwtClaims;
  @Builder.Default private Map<String, String> secret = new HashMap<>();
  private String accessToken;

  /** Holds the Refresh token, may be signed or unsigned. */
  private String refreshToken;
}
