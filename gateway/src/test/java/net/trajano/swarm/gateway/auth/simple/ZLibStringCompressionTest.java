package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class ZLibStringCompressionTest {

  @Test
  void compressDecompressStrings() {
    assertThat(ZLibStringCompression.decompress(ZLibStringCompression.compress("FOO"), 3))
        .isEqualTo("FOO");
  }

  @Test
  void brokenCompression() {

    final var fooz = ZLibStringCompression.compress("FOOZAA");
    assertThatThrownBy(
            () -> ZLibStringCompression.decompress(fooz.substring(0, fooz.length() - 2), 300))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void brokenCompression2() {

    final var fooz =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString("FOOZAA".getBytes(StandardCharsets.UTF_8));
    assertThatThrownBy(() -> ZLibStringCompression.decompress(fooz, 300))
        .isInstanceOf(UncheckedIOException.class);
  }

  @Test
  void compressDecompressStrings2() {
    assertThat(ZLibStringCompression.decompress(ZLibStringCompression.compress("FOO"), 4))
        .isEqualTo("FOO");
  }

  @Test
  void compressDecompressEmptyStrings() {

    final var compress = ZLibStringCompression.compress("");
    assertThat(compress).hasSize(11);
    assertThat(ZLibStringCompression.decompress(compress, 0)).isEmpty();
  }

  /** Test scenario when there's an attempted compression bomb */
  @Test
  void bombTest() {
    var tenMbSpaces = " ".repeat(10 * 1024 * 1024);
    final var compressed = ZLibStringCompression.compressToBytes(tenMbSpaces);

    assertThatThrownBy(() -> ZLibStringCompression.decompressUtf8(compressed, 20480))
        .isInstanceOf(UncheckedIOException.class)
        .getCause()
        .isInstanceOf(IOException.class)
        .hasMessage("Decompressing past limit 20480 bytes");
  }
}
