package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;
import lombok.With;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Table;

/**
 * This is mutable.
 *
 * @param id primary key (this is auto increment on the database)
 * @param jti JTI claim is used as the key for lookup
 * @param secretClaims JSON claims that are secret and used to refresh the session without asking
 *     for credentials.
 * @param issuedOn Initial issuance timestamp.
 * @param expiresOn When does the token expire.
 * @param keyId key ID used to verify the signature
 * @param versionNo optimistic locking version
 */
@Data
@Table
@Builder
@With
public class RefreshToken {
  @Id private Long id;
  private String jti;
  private String secretClaims;
  private Instant issuedOn;
  private Instant expiresOn;
  private String keyId;
  @Version @Builder.Default private int versionNo = 0;
}
