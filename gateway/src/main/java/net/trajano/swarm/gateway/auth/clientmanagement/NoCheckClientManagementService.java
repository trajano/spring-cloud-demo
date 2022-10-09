package net.trajano.swarm.gateway.auth.clientmanagement;

import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

/** This skips all checks. It will work even if the authorization is missing from the header. */
public class NoCheckClientManagementService implements ClientManagementService {

  public static final String UNKNOWN = "unknown";

  @Override
  public Mono<String> obtainClientIdFromAuthorization(String authorization) {

    return Mono.just(UNKNOWN);
  }

  @Override
  public Mono<String> obtainClientId(String clientId, String clientSecret) {

    return Mono.just(UNKNOWN);
  }

  @Override
  public Mono<String> obtainClientIdFromHeaders(HttpHeaders headers) {

    return Mono.just(UNKNOWN);
  }
}
