package net.trajano.swarm.gateway.datasource.redis;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwk.JsonWebKey;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.lang.JoseException;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class RedisUserSessions {

  private static final List<String> HASH_KEYS =
      List.of(
          "secretClaims",
          "issuedOn",
          "verificationJwk",
          "accessToken",
          "refreshToken",
          "accessTokenExpiresAt",
          "accessTokenIssuedOn");

  private final ReactiveStringRedisTemplate redisTemplate;

  private final RedisKeyBlocks redisKeyBlocks;

  private JsonWebKey convertToJsonWebKey(String json) {

    try {
      return JsonWebKey.Factory.newJwk(json);
    } catch (JoseException e) {
      throw new IllegalArgumentException(e);
    }
  }

  /**
   * Converts the value to JWT claims. It verifies that the client ID is in the audience.
   *
   * @param jsonClaims claims JSON
   * @param clientId client ID
   * @return JWT claims parsed.
   */
  private JwtClaims convertToJwtClaims(String jsonClaims, String clientId) {

    try {
      final var claims = JwtClaims.parse(jsonClaims);
      if (!claims.getAudience().contains(clientId)) {
        throw new SecurityException(
            "Client ID %s is not in the audience %s".formatted(clientId, claims.getAudience()));
      }
      return claims;
    } catch (MalformedClaimException | InvalidJwtException e) {
      throw new IllegalArgumentException(e);
    }
  }

  public Mono<Long> delete(UserSession userSession) {

    return redisTemplate.delete(redisKeyBlocks.forUserSession(userSession.getJwtId()));
  }

  public Mono<UserSession> findById(UUID jwtId, String clientId) {

    final var key = redisKeyBlocks.forUserSession(jwtId);

    return findByRedisKey(key, clientId);
  }

  private Mono<UserSession> findByRedisKey(final String key, final String clientId) {

    final var ttl = redisTemplate.getExpire(key);
    final var objectValues = redisTemplate.<String, String>opsForHash().multiGet(key, HASH_KEYS);

    return Mono.zip(objectValues, ttl)
        .map(
            t ->
                UserSession.builder()
                    .jwtId(redisKeyBlocks.forUserSessionRedisKey(key))
                    .secretClaims(convertToJwtClaims(t.getT1().get(0), clientId))
                    .issuedOn(Instant.parse(t.getT1().get(1)))
                    .verificationJwk(convertToJsonWebKey(t.getT1().get(2)))
                    .accessToken(t.getT1().get(3))
                    .refreshToken(t.getT1().get(4))
                    .accessTokenExpiresAt(Instant.parse(t.getT1().get(5)))
                    .accessTokenIssuedOn(Instant.parse(t.getT1().get(6)))
                    .ttl(t.getT2().toSeconds())
                    .build());
  }

  public Mono<UserSession> save(final UserSession userSession) {

    final var key = redisKeyBlocks.forUserSession(userSession.getJwtId());
    return redisTemplate
        .<String, String>opsForHash()
        .putAll(
            key,
            Map.of(
                "secretClaims",
                userSession.getSecretClaims().toJson(),
                "issuedOn",
                userSession.getIssuedOn().toString(),
                "verificationJwk",
                userSession.getVerificationJwk().toJson(),
                "accessToken",
                userSession.getAccessToken(),
                "refreshToken",
                userSession.getRefreshToken(),
                "accessTokenExpiresAt",
                userSession.getAccessTokenExpiresAt().toString(),
                "accessTokenIssuedOn",
                userSession.getAccessTokenIssuedOn().toString()))
        .filter(success -> success)
        .flatMap(i -> redisTemplate.expire(key, Duration.ofSeconds(userSession.getTtl())))
        .filter(success -> success)
        .switchIfEmpty(Mono.error(IllegalStateException::new))
        .thenReturn(userSession);
  }
}
