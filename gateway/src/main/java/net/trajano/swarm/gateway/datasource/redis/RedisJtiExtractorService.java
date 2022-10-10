package net.trajano.swarm.gateway.datasource.redis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.redis.UserSession;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.JwksVerificationKeyResolver;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisJtiExtractorService {
  private final AuthProperties properties;
  private final RedisUserSessions redisUserSessions;

  public Mono<String> extractJti(String refreshToken, String clientId) {
    // The JWT that's reconstituted from the original token
    final var kid = refreshToken.substring(0, refreshToken.indexOf("."));
    final var jwt =
        Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                    ("{\"kid\":\"%s\",\"alg\":\"%s\"}"
                            .formatted(kid, AlgorithmIdentifiers.ECDSA_USING_P256_CURVE_AND_SHA256))
                        .getBytes(StandardCharsets.US_ASCII))
            + refreshToken.substring(refreshToken.indexOf("."));

    final UUID jwtId = UUID.fromString(extractJtiWithoutValidation(refreshToken));

    return redisUserSessions
        .findById(jwtId)
        .map(UserSession::getVerificationJwk)
        .map(List::of)
        .map(
            jwks ->
                new JwtConsumerBuilder()
                    .setVerificationKeyResolver(new JwksVerificationKeyResolver(jwks))
                    .setRequireExpirationTime()
                    .setRequireJwtId()
                    .setExpectedAudience(true, clientId)
                    .setAllowedClockSkewInSeconds(properties.getAllowedClockSkewInSeconds())
                    .setJwsAlgorithmConstraints(
                        AlgorithmConstraints.ConstraintType.PERMIT,
                        AlgorithmIdentifiers.ECDSA_USING_P256_CURVE_AND_SHA256)
                    .build())
        .flatMap(
            consumer -> {
              final var start = System.currentTimeMillis();
              try {
                return Mono.just(consumer.processToClaims(jwt));
              } catch (InvalidJwtException e) {
                log.warn("Invalid JWT for refresh", e);
                return Mono.empty();
              } finally {
                final long l = System.currentTimeMillis() - start;
                if (l > 500) {
                  log.error("Refresh Signature validation time {}ms > 500ms ", l);
                } else if (l > 100) {
                  log.warn("Refresh Signature validation time {}ms > 100ms ", l);
                }
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

  private static final ObjectMapper objectMapper = new ObjectMapper();

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  static class Payload {
    private String jti;
  }

  @SneakyThrows
  public static String extractJtiWithoutValidation(String refreshToken) {

    var payload =
        refreshToken.substring(refreshToken.indexOf('.') + 1, refreshToken.lastIndexOf('.'));
    var p2 = objectMapper.readValue(Base64.getUrlDecoder().decode(payload), Payload.class);
    return p2.getJti();
  }
}
