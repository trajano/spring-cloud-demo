package net.trajano.swarm.gateway.auth.claims;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.auth.AuthServiceResponse;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.common.RedisKeyBlocks;
import net.trajano.swarm.gateway.common.dao.AccessTokens;
import net.trajano.swarm.gateway.common.dao.JsonWebKeyPairs;
import net.trajano.swarm.gateway.common.dao.RefreshTokens;
import net.trajano.swarm.gateway.common.domain.AccessToken;
import net.trajano.swarm.gateway.common.domain.JsonWebKeyPair;
import net.trajano.swarm.gateway.common.domain.RefreshToken;
import net.trajano.swarm.gateway.jwks.DatabaseJwksProvider;
import net.trajano.swarm.gateway.web.GatewayResponse;
import net.trajano.swarm.gateway.web.UnauthorizedGatewayResponse;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.NumericDate;
import org.jose4j.jwt.ReservedClaimNames;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.jose4j.lang.JoseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * This handles the functionality of an Identity Provider (IP). The IP's responsibility is to
 * provide the access token and provide capability to refresh and revoke the token. Provides the
 * token management for the {@link IdentityService}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty("spring.r2dbc.url")
public class DatabaseClaimsService implements ClaimsService {

  private final Logger securityLog = LoggerFactory.getLogger("security");

  private final Scheduler refreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "refreshToken");

  private final DatabaseJwksProvider jwksProvider;

  private final Scheduler jwtConsumerScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "jwtConsumer");

  private final AuthProperties properties;

  private final RedisKeyBlocks redisKeyBlocks;

  private final IdentityService<?, ?> identityService;

  private final AccessTokens accessTokens;

  private final RefreshTokens refreshTokens;

  private final JsonWebKeyPairs jsonWebKeyPairs;

  /**
   * Extracts the JTI from the refresh token sent by the client.
   *
   * @param refreshToken refresh token sent by the client
   * @return a mono with the JTI or error if it is not parsed.
   */
  private Mono<String> extractJti(String refreshToken, HttpHeaders headers) {
    if (MediaType.APPLICATION_FORM_URLENCODED.equals(headers.getContentType())) {
      return Mono.error(IllegalArgumentException::new);
    }
    if (!refreshToken.matches("[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+\\.[-_A-Za-z\\d]+")) {
      return Mono.error(IllegalArgumentException::new);
    }
    // The JWT that's reconstituted from the original token
    final var kid = refreshToken.substring(0, refreshToken.indexOf("."));
    final var jwt =
        Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                    ("{\"kid\":\"%s\",\"alg\":\"RS256\"}".formatted(kid))
                        .getBytes(StandardCharsets.US_ASCII))
            + refreshToken.substring(refreshToken.indexOf("."));

    return jsonWebKeyPairs
        .findById(kid)
        .map(JsonWebKeyPair::jwk)
        .publishOn(refreshTokenScheduler)
        .flatMap(
            jwk -> {
              try {
                return Mono.just(new JsonWebKeySet(jwk));
              } catch (JoseException e) {
                return Mono.error(e);
              }
            })
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
        .flatMap(
            consumer -> {
              try {
                return Mono.just(consumer.processToClaims(jwt));
              } catch (InvalidJwtException e) {
                return Mono.error(e);
              }
            })
        .flatMap(
            jwtClaims -> {
              try {
                return Mono.just(jwtClaims.getJwtId());
              } catch (MalformedClaimException e) {
                return Mono.error(e);
              }
            });
  }

  private String generateRefreshToken(String jti, Instant expiresAt) {

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(jti);
    jwtClaims.setExpirationTime(NumericDate.fromMilliseconds(expiresAt.toEpochMilli()));
    return jwtClaims.toJson();
  }

  @Override
  public Mono<JwtClaims> getClaims(String accessToken) {

    var jwtConsumerMono =
        jwksProvider
            .jsonWebKeySet()
            .publishOn(jwtConsumerScheduler)
            .map(
                t ->
                    new JwtConsumerBuilder()
                        .setVerificationKeyResolver(
                            new JwksVerificationKeyResolver(t.getJsonWebKeys()))
                        .setRequireSubject()
                        .setRequireExpirationTime()
                        .setRequireJwtId()
                        .setAllowedClockSkewInSeconds(10)
                        .setJwsAlgorithmConstraints(
                            AlgorithmConstraints.ConstraintType.PERMIT,
                            AlgorithmIdentifiers.RSA_USING_SHA256)
                        .build());

    final Mono<String> jwtMono =
        Mono.fromCallable(
                () ->
                    ZLibStringCompression.decompressIfNeeded(
                        accessToken, properties.getJwtSizeLimitInBytes()))
            .publishOn(jwtConsumerScheduler);

    return Mono.zip(jwtMono, jwtConsumerMono)
        .flatMap(t -> getClaims(t.getT1(), t.getT2()))
        .flatMap(this::validateClaims)
        .doOnError(
            SecurityException.class,
            ex -> securityLog.warn("security error obtaining claims: {}", ex.getMessage()));
  }

  private Mono<JwtClaims> getClaims(String jwt, JwtConsumer jwtConsumer) {

    return Mono.fromCallable(
            () -> {
              try {
                return jwtConsumer.processToClaims(jwt);
              } catch (InvalidJwtException e) {
                throw new SecurityException(e);
              }
            })
        .publishOn(jwtConsumerScheduler);
  }

  private Mono<Boolean> isJwtIdValid(String jwtId) {

    return accessTokens.existsByJtiAndNotExpired(jwtId, Instant.now());
  }

  /**
   * Refreshes the token and returns a new authentication response. May throw a {@link
   * IllegalArgumentException} if the token is not valid or expired.
   *
   * @param refreshToken refresh token
   * @param headers HTTP headers (will contain information for client validation)
   * @return updated access token response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> refresh(
      String refreshToken, HttpHeaders headers) {

    return extractJti(refreshToken, headers)
        .flatMap(jti -> refreshTokens.findByJtiAndNotExpired(jti, Instant.now()))
        .flatMap(
            refreshTokenDb -> {
              try {
                var secretClaims = JwtClaims.parse(refreshTokenDb.secretClaims());
                return Mono.zip(
                    identityService.refresh(secretClaims, refreshTokenDb.issuedOn(), headers),
                    Mono.just(refreshTokenDb.jti()));
              } catch (InvalidJwtException e) {
                return Mono.error(e);
              }
            })
        .flatMap(t -> storeAndSignIdentityServiceResponse(t.getT1(), t.getT2()))
        .map(
            oauthResponse -> AuthServiceResponse.builder().operationResponse(oauthResponse).build())
        .switchIfEmpty(Mono.error(SecurityException::new))
        .onErrorResume(
            SecurityException.class,
            ex -> {
              securityLog.warn("security error handling refresh request {}", ex.getMessage());
              return Mono.just(
                  AuthServiceResponse.builder()
                      .operationResponse(new UnauthorizedGatewayResponse())
                      .statusCode(HttpStatus.UNAUTHORIZED)
                      .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                      .build());
            })
        .doOnError(ex -> log.error("error processing refresh request", ex))
        .onErrorReturn(
            AuthServiceResponse.builder()
                .operationResponse(new UnauthorizedGatewayResponse())
                .statusCode(HttpStatus.UNAUTHORIZED)
                .build());
  }

  /**
   * Revokes the token. If the token didn't exist, add a 5-second penalty. Regardless if it is
   * present or not, this will return a successful response. Finds the refresh token (the refresh
   * token is stored as is and is queried). The access tokens that are associated with it will be
   * removed if present.
   *
   * @param refreshToken refresh token
   * @param headers ignored headers
   * @return gateway response
   */
  @Override
  public Mono<AuthServiceResponse<GatewayResponse>> revoke(
      String refreshToken, HttpHeaders headers) {

    return extractJti(refreshToken, headers)
        .flatMap(jti -> refreshTokens.findByJtiAndNotExpired(jti, Instant.now()))
        .flatMap(
            refreshTokenDb ->
                accessTokens
                    .deleteByJti(refreshTokenDb.jti())
                    .then(refreshTokens.delete(refreshTokenDb))
                    .thenReturn(
                        AuthServiceResponse.builder()
                            .operationResponse(GatewayResponse.builder().ok(true).build())
                            .statusCode(HttpStatus.OK)
                            .build()))
        .switchIfEmpty(
            Mono.just(
                AuthServiceResponse.builder()
                    .operationResponse(GatewayResponse.builder().ok(true).build())
                    .statusCode(HttpStatus.OK)
                    .delay(Duration.ofMillis(properties.getPenaltyDelayInMillis()))
                    .build()));
  }

  /** {@inheritDoc} */
  @Override
  public Mono<GatewayResponse> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse, String jwtId) {

    if (!identityServiceResponse.isOk()) {
      return Mono.error(IllegalStateException::new);
    }

    final var now = Instant.now();
    final var newJti = UUID.randomUUID().toString();

    // The identity service may pass in an expiration time for the access token in which case that
    // overrides
    // the one from the properties.
    final int accessTokenExpiresInSeconds;

    final JwtClaims tokenClaims = Objects.requireNonNull(identityServiceResponse.getClaims());
    try {
      if (tokenClaims.hasClaim(ReservedClaimNames.EXPIRATION_TIME)) {
        final Instant expiresAt = Instant.ofEpochSecond(tokenClaims.getExpirationTime().getValue());
        accessTokenExpiresInSeconds = (int) Duration.between(now, expiresAt).toSeconds();
      } else {
        accessTokenExpiresInSeconds = properties.getAccessTokenExpiresInSeconds();
      }
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }

    final var accessTokenExpiresOn = now.plusSeconds(accessTokenExpiresInSeconds);
    tokenClaims.setIssuer(properties.getIssuer());
    tokenClaims.setJwtId(newJti);
    tokenClaims.setExpirationTime(NumericDate.fromSeconds(accessTokenExpiresOn.getEpochSecond()));
    // at this point I have the data for the access token
    // now we need to assemble the refresh token

    var updatedAccessToken =
        jwksProvider
            .getSigningKey(0)
            .flatMap(
                jwks ->
                    accessTokens
                        .save(
                            new AccessToken(
                                newJti, JwtFunctions.getKid(jwks), accessTokenExpiresOn))
                        .thenReturn(jwks))
            .map(
                jwks -> {
                  var accessToken = JwtFunctions.sign(jwks, tokenClaims.toJson());
                  if (properties.isCompressClaims()) {
                    accessToken = ZLibStringCompression.compress(accessToken);
                  }
                  return accessToken;
                });

    final int refreshTokenExpiresInSeconds;
    final var updatedSecretClaims =
        Objects.requireNonNull(identityServiceResponse.getSecretClaims());
    try {
      if (updatedSecretClaims.hasClaim(ReservedClaimNames.EXPIRATION_TIME)) {
        final Instant expiresAt =
            Instant.ofEpochSecond(updatedSecretClaims.getExpirationTime().getValue());
        refreshTokenExpiresInSeconds = (int) Duration.between(now, expiresAt).toSeconds();
      } else {
        refreshTokenExpiresInSeconds = properties.getRefreshTokenExpiresInSeconds();
      }
    } catch (MalformedClaimException e) {
      return Mono.error(e);
    }

    final var refreshTokenExpiresOn = now.plusSeconds(refreshTokenExpiresInSeconds);

    final var updatedSecretClaimsJson = updatedSecretClaims.toJson();
    final var updatedRefreshToken =
        jwksProvider
            .getSigningKey(0)
            .flatMap(
                kp ->
                    Mono.justOrEmpty(jwtId)
                        .flatMap(jti -> refreshTokens.findByJtiAndNotExpired(jti, now))
                        .map(
                            oldRefreshToken -> {
                              final var unsignedNewRefreshToken =
                                  generateRefreshToken(newJti, refreshTokenExpiresOn);
                              final String newRefreshToken =
                                  JwtFunctions.refreshSign(kp, unsignedNewRefreshToken);
                              return new RefreshToken(
                                  oldRefreshToken.uuid(),
                                  newJti,
                                  newRefreshToken,
                                  updatedSecretClaimsJson,
                                  oldRefreshToken.issuedOn(),
                                  refreshTokenExpiresOn,
                                  JwtFunctions.getKid(kp),
                                  oldRefreshToken.versionNo());
                            })
                        .switchIfEmpty(
                            Mono.create(
                                sink -> {
                                  final String newRefreshToken =
                                      JwtFunctions.refreshSign(kp, newJti);
                                  sink.success(
                                      new RefreshToken(
                                          UUID.randomUUID().toString(),
                                          newJti,
                                          newRefreshToken,
                                          updatedSecretClaimsJson,
                                          now,
                                          refreshTokenExpiresOn,
                                          JwtFunctions.getKid(kp),
                                          0));
                                })))
            .flatMap(refreshTokens::save)
            .map(RefreshToken::token);

    // at this point I have both the refresh token and the access token, so I can now assemble the
    // gateway response.
    // this awkward sequence is needed to ensure refresh token is added before access token
    return updatedRefreshToken
        .flatMap(rt -> Mono.zip(updatedAccessToken, Mono.just(rt)))
        .map(
            args -> {
              var oauthTokenResponse = new OAuthTokenResponse();
              oauthTokenResponse.setOk(true);
              oauthTokenResponse.setAccessToken(args.getT1());
              oauthTokenResponse.setRefreshToken(args.getT2());
              oauthTokenResponse.setTokenType("Bearer");
              oauthTokenResponse.setExpiresIn(accessTokenExpiresInSeconds);
              return oauthTokenResponse;
            });
  }

  /**
   * Checks if the JwtId is still valid
   *
   * @param jwtClaims claims
   * @return claims as is if valid.
   */
  private Mono<JwtClaims> validateClaims(final JwtClaims jwtClaims) {

    try {
      final String jwtId = jwtClaims.getJwtId();
      return isJwtIdValid(jwtId)
          .filter(isValid -> isValid)
          .switchIfEmpty(
              Mono.error(
                  new SecurityException(
                      "unable to find redis key %s"
                          .formatted(redisKeyBlocks.accessTokenJtiKey(jwtId)))))
          .thenReturn(jwtClaims);
    } catch (MalformedClaimException e) {
      return Mono.error(new SecurityException(e));
    }
  }
}
