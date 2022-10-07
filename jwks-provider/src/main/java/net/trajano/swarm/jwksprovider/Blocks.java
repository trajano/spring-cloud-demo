package net.trajano.swarm.jwksprovider;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Blocks {

  @Builder.Default private long currentTimestamp = Instant.now().getEpochSecond();

  private String previousSigningRedisKey;

  private List<String> previous;

  private String currentSigningRedisKey;

  private List<String> current;

  private String nextSigningRedisKey;

  private List<String> next;
}
