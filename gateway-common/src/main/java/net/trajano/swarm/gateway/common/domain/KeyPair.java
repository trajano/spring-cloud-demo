package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * @param expiresOn When does the keypair expire.
 */
@Table("KeyPair")
public record KeyPair(@Id String keyId, String jwk, Instant expiresOn) {}
