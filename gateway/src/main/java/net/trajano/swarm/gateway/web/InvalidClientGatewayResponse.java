package net.trajano.swarm.gateway.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InvalidClientGatewayResponse extends GatewayResponse {

  public InvalidClientGatewayResponse() {

    super(false, "invalid_client", null);
  }
}
