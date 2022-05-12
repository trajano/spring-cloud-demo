package net.trajano.swarm.gateway.jwks;

import java.time.Duration;
import org.jose4j.jwk.JsonWebKeySet;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

/** This provides the JWKs used for JWT signing and encryption. */
public interface JwksProvider {

  Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds);

  Mono<JsonWebKeySet> jsonWebKeySet();

  Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration();
}
