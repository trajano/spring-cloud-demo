package net.trajano.swarm.gateway.auth;

import java.time.Duration;
import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
public class AuthServiceResponse<R> {

  /** this is the actual response to send back to the client */
  private R operationResponse;

  /** Duration to delay a mono output by. */
  private Duration delay = Duration.ZERO;

  /** HTTP Status. */
  private HttpStatus statusCode = HttpStatus.OK;
}
