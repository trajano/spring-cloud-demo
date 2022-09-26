package net.trajano.swarm.gateway;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ServerWebExchangeAttributes {

  public static final String JWT_ID = "jwtId";

  /** JWT Claims. {@link org.jose4j.jwt.JwtClaims}. */
  public static final String JWT_CLAIMS = "jwtClaims";
}
