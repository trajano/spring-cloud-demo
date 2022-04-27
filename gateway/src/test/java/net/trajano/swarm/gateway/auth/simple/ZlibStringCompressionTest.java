package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ZlibStringCompressionTest {

  @Test
  void compressDecompressStrings() {
    assertThat(ZlibStringCompression.decompress(ZlibStringCompression.compress("FOO")))
        .isEqualTo("FOO");
  }
}
