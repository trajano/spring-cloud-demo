package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ThreadLocalRandom;
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
    final var badData = fooz.substring(0, fooz.length() - 2);
    assertThatThrownBy(() -> ZLibStringCompression.decompress(badData, 300))
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

  @Test
  void possibleStarts() {

    final ThreadLocalRandom random = ThreadLocalRandom.current();
    byte[] sample = new byte[256];

    Set<String> x = new TreeSet<>();
    for (int i = 0; i < 2000; ++i) {
      random.nextBytes(sample);
      final String compress =
          ZLibStringCompression.compress(Base64.getUrlEncoder().encodeToString(sample));
      x.add(compress.substring(0, 3));
    }
    x.stream().forEach(System.out::println);
  }
}
