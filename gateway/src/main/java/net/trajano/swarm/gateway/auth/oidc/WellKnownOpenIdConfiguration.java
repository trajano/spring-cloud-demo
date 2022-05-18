package net.trajano.swarm.gateway.auth.oidc;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.URI;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WellKnownOpenIdConfiguration {
  private URI issuer;

  @JsonProperty("userinfo_endpoint")
  private URI userinfoEndpoint;

  @JsonProperty("jwks_uri")
  private URI jwksUri;
}
