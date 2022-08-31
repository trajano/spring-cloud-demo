package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.lang.Nullable;

/**
 * @param expiresOn When does the keypair expire.
 */
@Table
public record JsonWebKeyPair(@Id String keyId, String jwk, Instant expiresOn)
    implements Persistable<String> {

  @Nullable
  @Override
  public String getId() {

    return keyId;
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
