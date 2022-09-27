package net.trajano.swarm.sampleservice.echo;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EchoResponse {

  private String message;

  private Instant timestamp;
}
