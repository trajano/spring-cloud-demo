package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.auth.claims.JwtFunctions;
import net.trajano.swarm.gateway.auth.claims.ZLibStringCompression;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.NumericDate;
import org.jose4j.jwt.ReservedClaimNames;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(
    prefix = "auth",
    name = "datasource",
    havingValue = "REDIS",
    matchIfMissing = true)
public class RedisStoreAndSignIdentityService {

  private final AuthProperties properties;
  private final Scheduler refreshTokenScheduler;
  private final JwksProvider jwksProvider;

  private final RedisUserSessions redisUserSessions;

  private RefreshContext determineAccessTokenClaims(RefreshContext refreshContext) {

    final var tokenClaims =
        Objects.requireNonNull(refreshContext.getIdentityServiceResponse().getClaims());
    tokenClaims.setIssuer(properties.getIssuer());
    tokenClaims.setJwtId(refreshContext.getUserSession().getJwtId().toString());
    tokenClaims.setExpirationTime(
        NumericDate.fromSeconds(refreshContext.getAccessTokenExpiresAt().getEpochSecond()));
    return refreshContext.withAccessTokenClaims(tokenClaims);
  }

  private RefreshContext determineAccessTokenExpiration(RefreshContext refreshContext) {

    final JwtClaims tokenClaims =
        Objects.requireNonNull(refreshContext.getIdentityServiceResponse().getClaims());
    try {
      if (tokenClaims.hasClaim(ReservedClaimNames.EXPIRATION_TIME)) {
        final Instant expiresAt = Instant.ofEpochSecond(tokenClaims.getExpirationTime().getValue());
        return refreshContext.withAccessTokenExpiresAt(expiresAt);

      } else {
        return refreshContext.withAccessTokenExpiresAt(
            refreshContext.getNow().plusSeconds(properties.getAccessTokenExpiresInSeconds()));
      }
    } catch (MalformedClaimException e) {
      throw new IllegalStateException(e);
    }
  }

  private RefreshContext determineRefreshTokenClaims(RefreshContext refreshContext) {

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(refreshContext.getUserSession().getJwtId().toString());
    jwtClaims.setExpirationTime(
        NumericDate.fromSeconds(refreshContext.getRefreshTokenExpiresAt().getEpochSecond()));
    return refreshContext.withRefreshTokenClaims(jwtClaims);
  }

  private RefreshContext determineRefreshTokenExpiration(RefreshContext refreshContext) {

    final JwtClaims secretClaims =
        Objects.requireNonNull(refreshContext.getIdentityServiceResponse().getSecretClaims());
    try {
      if (secretClaims.hasClaim(ReservedClaimNames.EXPIRATION_TIME)) {
        final Instant expiresAt =
            Instant.ofEpochSecond(secretClaims.getExpirationTime().getValue());
        return refreshContext.withRefreshTokenExpiresAt(expiresAt);

      } else {
        return refreshContext.withRefreshTokenExpiresAt(
            refreshContext.getNow().plusSeconds(properties.getAccessTokenExpiresInSeconds()));
      }
    } catch (MalformedClaimException e) {
      throw new IllegalStateException(e);
    }
  }

  private Mono<RefreshContext> obtainExistingOrBuildRefreshToken(
      final RefreshContext refreshContext) {
    return Mono.justOrEmpty(refreshContext.getJwtId())
        .flatMap(jti -> redisUserSessions.findById(UUID.fromString(jti)))
        .switchIfEmpty(
            Mono.fromSupplier(
                () ->
                    UserSession.builder().jwtId(UUID.randomUUID()).issuedOn(Instant.now()).build()))
        .map(refreshContext::withUserSession);
  }

  /** This will take two signing keys and put them into the context. */
  private Mono<RefreshContext> obtainSigningKeys(RefreshContext refreshContext) {
    return Mono.zip(jwksProvider.getSigningKey(0), jwksProvider.getSigningKey(0))
        .map(
            keyPairs ->
                refreshContext
                    .withAccessTokenSigningKeyPair(keyPairs.getT1())
                    .withRefreshTokenSigningKeyPair(keyPairs.getT2()));
  }

  private RefreshContext updateUserSession(RefreshContext refreshContext) {

    return refreshContext.withUserSession(
        refreshContext
            .getUserSession()
            .withSecretClaims(refreshContext.getIdentityServiceResponse().getSecretClaims())
            .withTtl(
                Duration.between(Instant.now(), refreshContext.getRefreshTokenExpiresAt())
                    .toSeconds())
            .withVerificationJwk(
                JwtFunctions.getVerificationKeyFromJwks(
                        refreshContext.getRefreshTokenSigningKeyPair())
                    .orElseThrow()));
  }

  private Mono<RefreshContext> saveUserSession(RefreshContext refreshContext) {

    return redisUserSessions
        .save(refreshContext.getUserSession())
        .map(refreshContext::withUserSession);
  }

  /**
   * Signs the access token. This will compress the token if required.
   *
   * @param refreshContext refresh context
   * @return refresh context
   */
  private Mono<RefreshContext> signAccessToken(RefreshContext refreshContext) {

    return Mono.fromSupplier(
            () ->
                JwtFunctions.sign(
                    refreshContext.getAccessTokenSigningKeyPair(),
                    refreshContext.getAccessTokenClaims().toJson()))
        .map(
            signedAccessToken -> {
              if (properties.isCompressClaims()) {
                return ZLibStringCompression.compress(signedAccessToken);
              } else {
                return signedAccessToken;
              }
            })
        .map(refreshContext::withAccessToken);
  }

  private Mono<RefreshContext> signRefreshToken(RefreshContext refreshContext) {
    return Mono.fromSupplier(
            () ->
                JwtFunctions.refreshSign(
                    refreshContext.getRefreshTokenSigningKeyPair(),
                    refreshContext.getRefreshTokenClaims().toJson()))
        .map(refreshContext::withRefreshToken);
  }

  public Mono<RefreshContext> storeAndSignIdentityServiceResponse(
      IdentityServiceResponse identityServiceResponse, String jwtId, Instant now) {

    return Mono.just(
            RefreshContext.builder()
                .identityServiceResponse(identityServiceResponse)
                .jwtId(jwtId)
                .now(now)
                .build())
        .map(this::determineAccessTokenExpiration)
        .map(this::determineRefreshTokenExpiration)
        .flatMap(this::obtainSigningKeys)
        .flatMap(this::obtainExistingOrBuildRefreshToken)
        .map(this::determineAccessTokenClaims)
        .map(this::determineRefreshTokenClaims)
        .publishOn(jwtSigningScheduler)
        .flatMap(this::signAccessToken)
        .flatMap(this::signRefreshToken)
        .map(this::updateUserSession)
        .flatMap(this::saveUserSession);
  }

  private final Scheduler jwtSigningScheduler;
  /*
        final var now = Instant.now();

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

      final var accessTokenExpiresOn = now.plusSeconds(accessTokenExpiresInSeconds);
    final var refreshTokenExpiresOn = now.plusSeconds(refreshTokenExpiresInSeconds);

    final var keyPair = jwksProvider.getSigningKey(0);

    final var existingRecord =
        Mono.justOrEmpty(jwtId)
            .flatMap(jti -> redisUserSessions.findById(UUID.fromString(jti)))
            .switchIfEmpty(
                Mono.fromSupplier(
                    () ->
                        UserSession.builder()
                                .jwtId(UUID.randomUUID())
                            .issuedOn(Instant.now())
                            .ttl(Duration.between(Instant.now(), refreshTokenExpiresOn).toSeconds())
                            .build()));

    // given a keypair and existing record
    final var updatedRefreshToken =
        Mono.zip(keyPair, existingRecord)
            .flatMap(
                t ->
                    Mono.zip(
                        Mono.just(t.getT1()),
                        Mono.just(
                            t.getT2()
                                .withSecretClaims(updatedSecretClaims)
                                .withVerificationJwk(
                                    JwtFunctions.getVerificationKeyFromJwks(t.getT1())
                                        .orElseThrow()))))
            .flatMap(t -> Mono.zip(Mono.just(t.getT1()), redisUserSessions.save(t.getT2())))
            .map(Tuple2::getT1)
            .map(
                kp -> {
                    final var newJti = UUID.randomUUID().toString();
                  final var unsignedNewRefreshToken =
                      generateRefreshToken(newJti, refreshTokenExpiresOn);
                  return JwtFunctions.refreshSign(kp, unsignedNewRefreshToken);
                });

      // at this point I have both the refresh token and the access token, so I can now assemble the
    // gateway response.
    // this awkward sequence is needed to ensure refresh token is added before access token
    return updatedRefreshToken
        .flatMap(rt -> Mono.zip(updatedAccessToken(rt, accessTokenExpiresOn), Mono.just(rt)))
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

    private Mono<String> updatedAccessToken(String rt, Instant accessTokenExpiresOn) {
        final var accessTokenExpiresOn = now.plusSeconds(accessTokenExpiresInSeconds);
        tokenClaims.setIssuer(properties.getIssuer());
        tokenClaims.setJwtId(newJti);
        tokenClaims.setExpirationTime(NumericDate.fromSeconds(accessTokenExpiresOn.getEpochSecond()));

        return =
                jwksProvider
                        .getSigningKey(0)
                        .map(
                                jwks -> {
                                    var accessToken = JwtFunctions.sign(jwks, tokenClaims.toJson());
                                    if (properties.isCompressClaims()) {
                                        accessToken = ZLibStringCompression.compress(accessToken);
                                    }
                                    return accessToken;
                                });

    }

     */
}
