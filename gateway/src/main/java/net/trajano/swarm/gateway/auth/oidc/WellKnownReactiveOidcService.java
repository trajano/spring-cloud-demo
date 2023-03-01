package net.trajano.swarm.gateway.auth.oidc;

import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * This is a simple OidcService that uses well-known configuration to obtain the claims from the
 * userinfo endpoint.
 *
 * <p>By design, there is no need for JWKS processing because the request for the user info is
 * originating from gateway and the URL to the endpoint is obtained by gateway from the IP itself
 * and not the user.
 */
@Component
public class WellKnownReactiveOidcService implements ReactiveOidcService, InitializingBean {

  @Value("${auth.oidc.allowed-issuers:}")
  private String allowedIssuersCommaSeparatedList;

  /** Allowed issuers set. */
  private Set<URI> allowedIssuersSet;

  public static URI wellKnownOpenIdConfigurationUri(URI issuer) {
    return UriComponentsBuilder.fromUri(issuer)
        .pathSegment(".well-known", "openid-configuration")
        .build()
        .toUri();
  }

  @Override
  public void afterPropertiesSet() {

    allowedIssuersSet =
        Arrays.stream(allowedIssuersCommaSeparatedList.split(","))
            .map(URI::create)
            .collect(Collectors.toSet());
  }

  /**
   * Gets a flux of allowed issuers. This is from a comma separated list of
   * auth.oidc.allowed-issuers
   *
   * @return allowed issuers.
   */
  @Override
  public Flux<URI> allowedIssuers() {

    return Flux.fromIterable(allowedIssuersSet);
  }

  /**
   * This will use the well-known endpoint to obtain the user info endpoint URI.
   *
   * <p>Classes that extend this can have issuer specific implementations to support issuers that do
   * not support the well-known/openid-configuration endpoint or do not use a {@code
   * userinfo_endpoint}.
   *
   * @param issuer issuer
   * @param accessToken access token provided by the IP to get the user info.
   * @return
   */
  @Override
  public Mono<JwtClaims> getClaims(URI issuer, String accessToken) {

    return WebClient.create()
        .get()
        .uri(wellKnownOpenIdConfigurationUri(issuer))
        .accept(MediaType.APPLICATION_JSON)
        .exchangeToMono(
            clientResponse -> clientResponse.bodyToMono(WellKnownOpenIdConfiguration.class))
        .flatMap(
            openIdConfiguration ->
                getClaims(issuer, accessToken, openIdConfiguration.getUserinfoEndpoint()));
  }

  /**
   * This obtains the claims from the issuer with a defined user info and JWKS endpoint. This is
   * made protected so clients that extend this may provide caching facilities. This will also add
   * the issuer claim to the claim set.
   *
   * @param issuer issuer
   * @param accessToken access token provided by the IP to get the user info.
   * @param userinfoEndpoint user information endpoint. May be null if there is a specific handling
   *     for the issuer.
   * @return claims
   */
  protected Mono<JwtClaims> getClaims(URI issuer, String accessToken, URI userinfoEndpoint) {

    return WebClient.create()
        .get()
        .uri(userinfoEndpoint)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
        .accept(MediaType.APPLICATION_JSON)
        .exchangeToMono(clientResponse -> clientResponse.bodyToMono(String.class))
        .flatMap(this::parseJwtClaimsJson)
        .map(
            jwtClaims -> {
              // this mutates
              jwtClaims.setIssuer(issuer.toASCIIString());
              return jwtClaims;
            });
  }

  private Mono<JwtClaims> parseJwtClaimsJson(String claimsJson) {

    try {
      return Mono.just(JwtClaims.parse(claimsJson));
    } catch (InvalidJwtException e) {
      return Mono.error(e);
    }
  }
}
