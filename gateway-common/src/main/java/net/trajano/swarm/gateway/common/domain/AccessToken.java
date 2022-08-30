package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * @param jti JTI claim is used as the key
 * @param expiresOn When does the token expire.
 */
@Table("AccessToken")
public record AccessToken(@Id String jti, Instant expiresOn) {}
