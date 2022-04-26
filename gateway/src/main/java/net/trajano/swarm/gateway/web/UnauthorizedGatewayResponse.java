package net.trajano.swarm.gateway.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UnauthorizedGatewayResponse extends GatewayResponse {

  public UnauthorizedGatewayResponse() {

    super(false, "invalid_token");
  }
}
