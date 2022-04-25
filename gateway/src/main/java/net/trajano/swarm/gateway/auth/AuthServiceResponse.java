package net.trajano.swarm.gateway.auth;

import java.time.Duration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import net.trajano.swarm.gateway.web.GatewayResponse;
import org.springframework.http.HttpStatus;

@Data
@Builder
@AllArgsConstructor
public class AuthServiceResponse<R extends GatewayResponse> {

  /** this is the actual response to send back to the client */
  private R operationResponse;

  /** Duration to delay a mono output by. */
  @Builder.Default private Duration delay = Duration.ZERO;

  /** HTTP Status. */
  @Builder.Default private HttpStatus statusCode = HttpStatus.OK;
}
