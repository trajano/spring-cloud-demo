package net.trajano.swarm.gateway.auth.simple;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.AuthService;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.consumer.*;
import org.jose4j.jwx.JsonWebStructure;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.jose4j.lang.JoseException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class SimpleAuthService<P>
    implements AuthService<SimpleAuthenticationRequest, GatewayResponse, P> {

  private final SimpleAuthServiceProperties properties;

  private final RedisAuthCache redisTokenCache;

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> authenticate(
      Mono<SimpleAuthenticationRequest> authenticationRequestMono, HttpHeaders headers) {

    return authenticationRequestMono.flatMap(
        authenticationRequest -> {
          if (authenticationRequest.isAuthenticated()) {
            return redisTokenCache
                .buildOAuthTokenWithUsername(
                    authenticationRequest.getUsername(),
                    properties.getAccessTokenExpiresInSeconds())
                .map(token -> AuthServiceResponse.builder().operationResponse(token).build());

          } else {

            return Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(new UnauthorizedGatewayResponse())
                    .statusCode(HttpStatus.UNAUTHORIZED)
                    .delay(Duration.of(5, ChronoUnit.SECONDS))
                    .build());
          }
        });
  }

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, Map<String, String> headers) {

    return null;
  }

  @Override
  public Mono<P> getProfile(String accessToken) {

    return null;
  }

  /**
   * @param accessToken access token which is a JWE
   * @return claims
   */
  @Override
  public Mono<JwtClaims> getClaims(String accessToken) {

    return jsonWebKeySet()
            .map(jwks->
              new JwtConsumerBuilder()
                      .setVerificationKeyResolver(new JwksVerificationKeyResolver(jwks.getJsonWebKeys()))
                      .setRequireSubject()
                      .setRequireExpirationTime()
                      .setRequireJwtId()
                      .setAllowedClockSkewInSeconds(10)
                      .setJwsCustomizer(new JwsCustomizer() {
                        @Override
                        public void customize(JsonWebSignature jws, List<JsonWebStructure> nestingContext) {

                        }
                      })
                      .setJwsAlgorithmConstraints(AlgorithmConstraints.ConstraintType.PERMIT, AlgorithmIdentifiers.RSA_USING_SHA512)
                      .build()
            )
            .flatMap(jwtConsumer -> getClaims(accessToken, jwtConsumer));
  }

  private Mono<JwtClaims> getClaims(String accessToken, JwtConsumer jwtConsumer) {
    try {

        if (properties.isCompressClaims()) {
          final var process = jwtConsumer.process(accessToken);
          var bytes = ((JsonWebSignature)process.getJoseObjects().get(0)).getPayloadBytes();
          var claimsJson = ZLibStringCompression.decompressUtf8(bytes, properties.getJwtSizeLimitInBytes());
          Mono.just(JwtClaims.parse(claimsJson));
        } else {
          Mono.just(jwtConsumer.processToClaims(accessToken));

        }

      return Mono.just(new JwtClaims());
    } catch (InvalidJwtException | JoseException e) {
      return Mono.error(e);
    }
  }

  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, Map<String, String> headers) {

    return null;
  }

  @Override
  public Mono<JsonWebKeySet> jsonWebKeySet() {

    return redisTokenCache.jwks().collectList().map(JsonWebKeySet::new);
  }
}
