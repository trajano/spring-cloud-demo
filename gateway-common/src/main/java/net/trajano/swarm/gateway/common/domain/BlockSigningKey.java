package net.trajano.swarm.gateway.common.domain;

import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * @param uuid Primary key.
 * @param epochSecondsBlock The start of epoch seconds block.
 * @param keyId The key ID
 */
@Table("BlockSigningKey")
public record BlockSigningKey(@Id UUID uuid, long epochSecondsBlock, String keyId) {}
