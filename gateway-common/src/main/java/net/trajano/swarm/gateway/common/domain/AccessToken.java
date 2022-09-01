package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.lang.Nullable;

/**
 * There is no need to store the access token value because it has already been sent and will not be
 * used by the server again.
 *
 * @param jti JTI claim is used as the key
 * @param keyId key ID that is used to validate the token
 * @param expiresOn When does the token expire.
 */
@Table
public record AccessToken(@Id String jti, String keyId, Instant expiresOn)
    implements Persistable<String> {
  @Nullable
  @Override
  public String getId() {

    return jti;
  }

  /**
   * This entity is insert only so it will always be new.
   *
   * @return true
   */
  @Override
  public boolean isNew() {

    return true;
  }
}
