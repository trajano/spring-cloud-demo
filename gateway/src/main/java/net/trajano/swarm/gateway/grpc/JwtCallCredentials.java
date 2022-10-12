package net.trajano.swarm.gateway.grpc;

import io.grpc.CallCredentials;
import io.grpc.Metadata;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;

/** Provides the JWT into the meta data */
@RequiredArgsConstructor
public class JwtCallCredentials extends CallCredentials {

  // JWT key, may pass the key to use.
  public static final Metadata.Key<String> JWT_CLAIMS_KEY =
      Metadata.Key.of("jwtClaims", Metadata.ASCII_STRING_MARSHALLER);

  private final String jwt;

  @Override
  public void applyRequestMetadata(
      RequestInfo requestInfo, Executor appExecutor, MetadataApplier applier) {

    appExecutor.execute(
        () -> {
          final var metadata = new Metadata();
          metadata.put(JWT_CLAIMS_KEY, jwt);
          applier.apply(metadata);
        });
  }

  @Override
  public void thisUsesUnstableApi() {
    // no-op
  }
}
