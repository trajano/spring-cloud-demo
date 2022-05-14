package net.trajano.swarm.gateway.auth.simple;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.lang.JoseException;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Slf4j
public class SimpleIdentityService<P> implements IdentityService<SimpleAuthenticationRequest, P> {

  public static final String X_JWT_ASSERTION = "X-JWT-Assertion";

  public static final String X_JWT_AUDIENCE = "X-JWT-Audience";

  private final JwksProvider jwksProvider;

  @Override
  public Mono<IdentityServiceResponse> authenticate(
      SimpleAuthenticationRequest authenticationRequest, HttpHeaders headers) {

    if (authenticationRequest.isAuthenticated()) {
      final var claims = new JwtClaims();
      claims.setSubject(authenticationRequest.getUsername());
      Optional.ofNullable(authenticationRequest.getAccessTokenExpiresInMillis())
          .map(millis -> millis / 60000.0f)
          .ifPresent(claims::setExpirationTimeMinutesInTheFuture);

      final var secretClaims = new JwtClaims();
      secretClaims.setStringClaim("secret-uuid", UUID.randomUUID().toString());
      secretClaims.setSubject(authenticationRequest.getUsername());
      Optional.ofNullable(authenticationRequest.getAccessTokenExpiresInMillis())
          .map(millis -> millis / 60000.0f)
          .ifPresent(minutes -> secretClaims.setClaim("access-token-expires-in-minutes", minutes));

      Optional.ofNullable(authenticationRequest.getRefreshTokenExpiresInMillis())
          .map(millis -> millis / 60000.0f)
          .ifPresent(claims::setExpirationTimeMinutesInTheFuture);

      final IdentityServiceResponse response =
          IdentityServiceResponse.builder()
              .ok(true)
              .claims(claims)
              .secretClaims(secretClaims)
              .build();
      log.trace("response {}", response);
      return Mono.just(response);

    } else {
      return Mono.just(
          IdentityServiceResponse.builder().ok(false).penaltyDelayInSeconds(2).build());
    }
  }

  @Override
  public Mono<IdentityServiceResponse> refresh(JwtClaims secretClaims, HttpHeaders headers) {

    try {
      final var claims = new JwtClaims();
      claims.setSubject(secretClaims.getSubject());

      return Mono.just(
          IdentityServiceResponse.builder()
              .claims(secretClaims)
              .secretClaims(secretClaims)
              .build());
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }
  }

  @Override
  public Mono<P> getProfile(String accessToken) {

    return null;
  }

  @Override
  public ServerWebExchange mutateDownstreamRequest(
      ServerWebExchange exchange, JwtClaims jwtClaims) {

    final String jwtAssertion;
    final String audience;

    try {
      final var jws = new JsonWebSignature();
      jws.setAlgorithmConstraints(AlgorithmConstraints.ALLOW_ONLY_NONE);
      jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.NONE);
      jws.setPayload(jwtClaims.toJson());
      jws.sign();
      jwtAssertion = jws.getCompactSerialization();
      audience = String.join(",", jwtClaims.getAudience());
    } catch (MalformedClaimException | JoseException e) {
      throw new IllegalArgumentException(e);
    }
    return exchange
        .mutate()
        .request(
            exchange
                .getRequest()
                .mutate()
                .header(X_JWT_ASSERTION, jwtAssertion)
                .header(X_JWT_AUDIENCE, audience)
                .build())
        .build();
  }
}
