package net.trajano.swarm.gateway.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UnauthorizedGatewayResponse extends GatewayResponse {

  public UnauthorizedGatewayResponse() {

    super(false, "invalid_token");
  }
}
