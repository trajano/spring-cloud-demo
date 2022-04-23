package net.trajano.swarm.gateway.auth.simple;

import lombok.Data;

@Data
public class SimpleAuthenticationRequest {

  /** Username of the person. */
  String username;

  /** Indicates that the user is to be authenticated successfully. */
  boolean authenticated;
}
