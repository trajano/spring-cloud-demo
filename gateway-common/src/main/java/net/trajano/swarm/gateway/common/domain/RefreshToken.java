package net.trajano.swarm.gateway.common.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Table;

/**
 * @param id primary key (this is auto increment on the database)
 * @param jti JTI claim is used as the key for lookup
 * @param token the JWT that is passed from the client.
 * @param secretClaims JSON claims that are secret and used to refresh the session without asking
 *     for credentials.
 * @param issuedOn Initial issuance timestamp.
 * @param expiresOn When does the token expire.
 * @param keyId key ID used to verify the signature
 * @param versionNo optimistic locking version
 */
@Table
public record RefreshToken(
    @Id Long id,
    String jti,
    String token,
    String secretClaims,
    Instant issuedOn,
    Instant expiresOn,
    String keyId,
    @Version int versionNo) {}
