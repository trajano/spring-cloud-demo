package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.SoftAssertions.assertSoftly;

import org.junit.jupiter.api.Test;

class RedisBlockTests {

  /** Figure out math to get the next block */
  @Test
  void getNextBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computeNextBlock(0, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(1, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(2, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(3, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(4, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(5, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(6, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(7, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(8, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(9, 10)).isEqualTo(10);
          softly.assertThat(computeNextBlock(10, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(11, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(12, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(13, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(14, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(15, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(16, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(17, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(18, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(19, 10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(20, 10)).isEqualTo(30);
        });
  }

  /** Figure out math to get the current block */
  @Test
  void getCurrentBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computeCurrentBlock(0, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(1, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(2, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(3, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(4, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(5, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(6, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(7, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(8, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(9, 10)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(10, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(11, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(12, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(13, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(14, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(15, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(16, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(17, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(18, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(19, 10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(20, 10)).isEqualTo(20);
        });
  }

  /** Figure out math to get the current block */
  @Test
  void getPreviousBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computePreviousBlock(0, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(1, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(2, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(3, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(4, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(5, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(6, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(7, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(8, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(9, 10)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(10, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(11, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(12, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(13, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(14, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(15, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(16, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(17, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(18, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(19, 10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(20, 10)).isEqualTo(10);
        });
  }

  private long computeNextBlock(long current, long blockSize) {

    return RedisKeyBlocks.computeBlock(current, blockSize, 1);
  }

  private long computeCurrentBlock(long current, long blockSize) {

    return RedisKeyBlocks.computeBlock(current, blockSize, 0);
  }

  private long computePreviousBlock(long current, long blockSize) {

    return RedisKeyBlocks.computeBlock(current, blockSize, -1);
  }
}
