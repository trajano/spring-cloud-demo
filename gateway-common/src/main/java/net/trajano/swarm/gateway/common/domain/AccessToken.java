package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.lang.Nullable;

/**
 * @param jti JTI claim is used as the key
 * @param expiresOn When does the token expire.
 */
@Table
public record AccessToken(@Id String jti, Instant expiresOn) implements Persistable<String> {
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
