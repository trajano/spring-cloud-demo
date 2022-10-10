package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
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
  private final JwksProvider jwksProvider;

  private final RedisUserSessions redisUserSessions;

  private final Scheduler jwtSigningScheduler;

  private RefreshContext determineAccessTokenClaims(RefreshContext refreshContext) {

    final var tokenClaims =
        Objects.requireNonNull(refreshContext.getIdentityServiceResponse().getClaims());
    tokenClaims.setIssuer(properties.getIssuer());
    tokenClaims.setJwtId(refreshContext.getUserSession().getJwtId().toString());
    tokenClaims.setExpirationTime(
        NumericDate.fromSeconds(refreshContext.getAccessTokenExpiresAt().getEpochSecond()));
    tokenClaims.setAudience(refreshContext.getClientId(), properties.getIssuer());
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
    jwtClaims.setAudience(refreshContext.getClientId());
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
                    UserSession.builder()
                        .jwtId(randomUUID())
                        .issuedOn(Instant.now())
                        .clientId(refreshContext.getClientId())
                        .build()))
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

  private UUID randomUUID() {
    if (properties.isUseSecureRandom()) {
      return UUID.randomUUID();
    } else {
      var random = ThreadLocalRandom.current();
      return new UUID(random.nextLong(), random.nextLong());
    }
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
      IdentityServiceResponse identityServiceResponse, String jwtId, Instant now, String clientId) {

    return Mono.just(
            RefreshContext.builder()
                .identityServiceResponse(identityServiceResponse)
                .jwtId(jwtId)
                .clientId(clientId)
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

  private RefreshContext updateUserSession(RefreshContext refreshContext) {

    final var now = Instant.now();
    return refreshContext.withUserSession(
        refreshContext
            .getUserSession()
            .withSecretClaims(refreshContext.getIdentityServiceResponse().getSecretClaims())
            .withTtl(Duration.between(now, refreshContext.getRefreshTokenExpiresAt()).toSeconds())
            .withAccessToken(refreshContext.getAccessToken())
            .withRefreshToken(refreshContext.getRefreshToken())
            .withAccessTokenExpiresAt(refreshContext.getAccessTokenExpiresAt())
            .withAccessTokenIssuedOn(now)
            .withVerificationJwk(
                JwtFunctions.getVerificationKeyFromJwks(
                        refreshContext.getRefreshTokenSigningKeyPair())
                    .orElseThrow()));
  }
}
