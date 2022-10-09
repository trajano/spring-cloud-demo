package net.trajano.swarm.gateway.jwks;

import java.time.Duration;
import org.jose4j.jwk.JsonWebKeySet;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

/** This provides the JWKs used for JWT signing and encryption. */
public interface JwksProvider {

  Mono<JsonWebKeySet> getSigningKey(int accessTokenExpirationInSeconds);

  /**
   * Returns the active JSON Web Key set excluding private keys. This set is returned to /jwks and
   * is used for access token validation.
   *
   * @return Json web key set
   */
  Mono<JsonWebKeySet> jsonWebKeySet();

  Mono<Tuple2<JsonWebKeySet, Duration>> jsonWebKeySetWithDuration();
}
