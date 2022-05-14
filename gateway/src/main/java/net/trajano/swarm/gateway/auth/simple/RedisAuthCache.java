package net.trajano.swarm.gateway.auth.simple;

import java.security.*;
import java.util.*;
import javax.annotation.PostConstruct;
import javax.crypto.KeyGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.jose4j.jwt.JwtClaims;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * There's a few redis keys that are used.
 *
 * <p>1. Symettric keys
 *
 * <p>
 *
 * <p>Keep note that there are limitations on Redis that one must be aware of.
 *
 * @see
 *     <ul>
 *       <li><a
 *           href="https://stackoverflow.com/questions/51498737/how-to-use-redis-scan-in-cluster-enviroment">You
 *           cannot SCAN across cluster nodes</a>>
 *       <li><a href=https://github.com/redis/redis/issues/242#issuecomment-3512819">Inability to
 *           expire hash elements.</a>>
 *     </ul>
 */
@RequiredArgsConstructor
@Slf4j
public class RedisAuthCache {

  public static final String RSA = "RSA";

  private final ReactiveStringRedisTemplate redisTemplate;

  private final SimpleAuthRedisKeyBlocks redisKeyBlocks;

  private final SimpleAuthServiceProperties simpleAuthServiceProperties;

  private final Scheduler generateRefreshTokenScheduler =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "generateRefreshToken");

  private final Scheduler signingGenerator =
      Schedulers.newBoundedElastic(
          Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
          Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
          "signing");

  private final JwksProvider jwksProvider;

  private KeyGenerator keyGenerator;

  private SecureRandom secureRandom;

  /**
   * Generates a refresh token, it's in a form of a JWT claimset JSON so it can be signed.
   *
   * @return refresh token
   */
  private String generateRefreshToken(Random random) {

    final byte[] bytes = new byte[32];
    random.nextBytes(bytes);

    final var jwtClaims = new JwtClaims();
    jwtClaims.setJwtId(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getRefreshTokenExpiresInSeconds() / 60.0f);
    return jwtClaims.toJson();
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void initializeCrypto() {

    try {
      keyGenerator = KeyGenerator.getInstance("AES");
      secureRandom = SecureRandom.getInstanceStrong();
      keyGenerator.init(256, secureRandom);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public Mono<Boolean> isJwtIdValid(String jwtId) {

    return redisTemplate.hasKey(redisKeyBlocks.accessTokenJtiKey(jwtId));
  }

  public AuthenticationItem populateClaimsFromSecret(AuthenticationItem authenticationItem) {

    var jwtClaims = new JwtClaims();
    jwtClaims.setGeneratedJwtId();
    jwtClaims.setIssuer("https://localhost");
    jwtClaims.setSubject(authenticationItem.getSecret().get("username"));
    jwtClaims.setExpirationTimeMinutesInTheFuture(
        simpleAuthServiceProperties.getAccessTokenExpiresInSeconds() / 60.0f);
    return authenticationItem.withJwtClaims(jwtClaims);
  }

  /**
   * Signs both the refresh token and JWT claims
   *
   * @param authenticationItem
   * @return
   */
  public Mono<AuthenticationItem> provideAccessTokenAndRefreshToken(
      AuthenticationItem authenticationItem) {

    final var signedAccessTokenMono =
        jwksProvider
            .getSigningKey(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())
            .publishOn(Schedulers.parallel())
            .map(signingJwks -> JwtFunctions.sign(signingJwks, authenticationItem.getAccessToken()))
            .map(
                jwt ->
                    simpleAuthServiceProperties.isCompressClaims()
                        ? ZLibStringCompression.compress(jwt)
                        : jwt);
    final var signedRefreshTokenMono =
        jwksProvider
            .getSigningKey(simpleAuthServiceProperties.getAccessTokenExpiresInSeconds())
            .publishOn(Schedulers.parallel())
            .map(
                signingJwks ->
                    JwtFunctions.sign(signingJwks, authenticationItem.getRefreshToken()));

    return Mono.zip(signedAccessTokenMono, signedRefreshTokenMono)
        .map(t -> authenticationItem.withAccessToken(t.getT1()).withRefreshToken(t.getT2()))
        .publishOn(generateRefreshTokenScheduler);
  }
}
