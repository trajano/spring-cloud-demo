package net.trajano.swarm.gateway.jwks;

import org.jose4j.jwk.JsonWebKeySet;
import reactor.core.publisher.Mono;

/** This provides the JWKs used for JWT signing and encryption. */
public interface JwksProvider {

  Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds);

  Mono<JsonWebKeySet> jsonWebKeySet();
}
