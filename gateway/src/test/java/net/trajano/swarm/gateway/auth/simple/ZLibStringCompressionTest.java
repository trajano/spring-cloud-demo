package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.UncheckedIOException;

class ZLibStringCompressionTest {

  @Test
  void compressDecompressStrings() {
    assertThat(ZLibStringCompression.decompress(ZLibStringCompression.compress("FOO")))
        .isEqualTo("FOO");
  }

  /**
   * Test scenario when there's an attempted compression bomb
   */
  @Test
  void bombTest() {
    var tenMbSpaces = " ".repeat(10 * 1024 * 1024);
    final var compressed = ZLibStringCompression.compressToBytes(tenMbSpaces);

    assertThatThrownBy(()-> ZLibStringCompression.decompressUtf8(compressed, 20480))
            .isInstanceOf(UncheckedIOException.class)
            .getCause()
            .isInstanceOf(IOException.class)
            .hasMessage("Decompressing past limit 20480 bytes");

  }

}
