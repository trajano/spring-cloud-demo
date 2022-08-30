package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import java.util.UUID;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Table("RefreshToken")
public class RefreshToken {

  /** Primary key */
  @Id private UUID uuid;

  /** JTI claim is used as the key for lookup */
  private String jti;

  /** JSON claims that are secret and used to */
  private String secretClaims;

  /** When does the token expire. */
  private Instant expiresOn;

  @Version private int versionNo;
}
