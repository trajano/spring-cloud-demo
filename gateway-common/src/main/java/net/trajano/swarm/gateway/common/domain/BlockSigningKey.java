package net.trajano.swarm.gateway.common.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.lang.Nullable;

/**
 * @param id primary key (this is auto increment on the database)
 * @param epochSecondsBlock The start of epoch seconds block.
 * @param keyId The key ID
 */
@Table
public record BlockSigningKey(@Id Long id, long epochSecondsBlock, String keyId)
    implements Persistable<Long> {

  @Nullable
  @Override
  public Long getId() {

    return id;
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
