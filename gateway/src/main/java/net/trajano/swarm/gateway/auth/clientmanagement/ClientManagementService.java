package net.trajano.swarm.gateway.auth.clientmanagement;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This manages authorization clients. If the data is missing or there's an error a Mono.error with
 * InvalidClientException is returned
 */
public interface ClientManagementService {

  Pattern AUTHORIZATION_HEADER_PATTERN = Pattern.compile("^Basic ([A-Za-z0-9+/=]+)$");

  Mono<String> obtainClientId(String clientId, String clientSecret);

  default Mono<String> obtainClientIdFromAuthorization(String authorization) {

    if (authorization == null) {
      return Mono.error(InvalidClientException::new);
    }
    final var m = AUTHORIZATION_HEADER_PATTERN.matcher(authorization);
    if (!m.matches()) {
      return Mono.error(InvalidClientException::new);
    }
    try {
      var decoded = new String(Base64.getDecoder().decode(m.group(1)), StandardCharsets.US_ASCII);
      final var split = decoded.split(":");
      if (split.length != 2) {
        return Mono.error(InvalidClientException::new);
      }
      return obtainClientId(split[0], split[1]);
    } catch (RuntimeException e) {
      return Mono.error(new InvalidClientException(e));
    }
  }

  default Mono<String> obtainClientIdFromHeaders(HttpHeaders headers) {

    return obtainClientIdFromAuthorization(headers.getFirst(HttpHeaders.AUTHORIZATION));
  }

  default Mono<String> obtainClientIdFromServerExchange(ServerWebExchange exchange) {

    return obtainClientIdFromHeaders(exchange.getRequest().getHeaders());
  }
}
