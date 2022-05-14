package net.trajano.swarm.gateway.auth.simple;

import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.jose4j.lang.JoseException;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@RequiredArgsConstructor
@Slf4j
public class SimpleIdentityService<P> implements IdentityService<SimpleAuthenticationRequest, P> {

  public static final String X_JWT_ASSERTION = "X-JWT-Assertion";

  public static final String X_JWT_AUDIENCE = "X-JWT-Audience";

  private final SimpleAuthServiceProperties properties;

  private final JwksProvider jwksProvider;

  private final RedisAuthCache redisTokenCache;

  private final Scheduler jwtConsumerScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwtConsumer");

  private final Scheduler refreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "refreshToken");

  @Override
  public Mono<IdentityServiceResponse> authenticate(
      SimpleAuthenticationRequest authenticationRequest, HttpHeaders headers) {

    if (authenticationRequest.isAuthenticated()) {
      final var claims = new JwtClaims();
      claims.setSubject(authenticationRequest.getUsername());

      final var secretClaims = new JwtClaims();
      secretClaims.setStringClaim("secret-uuid", UUID.randomUUID().toString());
      secretClaims.setSubject(authenticationRequest.getUsername());

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

  public Mono<String> getRefreshTokenKey(String refreshToken) {

    return jsonWebKeySet()
        .publishOn(Schedulers.parallel())
        .map(
            jwks ->
                new JwtConsumerBuilder()
                    .setVerificationKeyResolver(
                        new JwksVerificationKeyResolver(jwks.getJsonWebKeys()))
                    .setRequireExpirationTime()
                    .setRequireJwtId()
                    .setAllowedClockSkewInSeconds(10)
                    .setJwsAlgorithmConstraints(
                        AlgorithmConstraints.ConstraintType.PERMIT,
                        AlgorithmIdentifiers.RSA_USING_SHA256)
                    .build())
        .map(
            jwtConsumer -> {
              try {
                return jwtConsumer.processToClaims(refreshToken).toJson();
              } catch (InvalidJwtException e) {
                throw new SecurityException(e);
              }
            });
  }

  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return jwksProvider.jsonWebKeySet();
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

  /**
   * Here's the sequence.
   *
   * <ol>
   *   <li>secrets
   *   <li>new JWT(jti + secret.username) ::: new secret
   *   <li>unsigned access token (as JSON string) ::: new unsigned refresh token
   *   <li>new access token ::: new refresh token
   *   <li>new oauth token
   * </ol>
   *
   * @param secrets secrets
   * @param headers HTTP headers
   * @return refresh response
   */
  @Override
  public Mono<Map<String, String>> refresh(Map<String, String> secrets, HttpHeaders headers) {

    return Mono.just(secrets);
  }
}
