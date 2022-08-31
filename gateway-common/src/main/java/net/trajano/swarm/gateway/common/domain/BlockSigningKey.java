package net.trajano.swarm.gateway.common.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.lang.Nullable;

/**
 * @param uuid Primary key. This is a UUID but must be represented as string.
 * @param epochSecondsBlock The start of epoch seconds block.
 * @param keyId The key ID
 */
@Table
public record BlockSigningKey(@Id String uuid, long epochSecondsBlock, String keyId)
    implements Persistable<String> {

  @Nullable
  @Override
  public String getId() {

    return uuid;
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
