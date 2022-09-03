package net.trajano.swarm.gateway.common;

import static org.assertj.core.api.SoftAssertions.assertSoftly;

import net.trajano.swarm.gateway.redis.RedisKeyBlocks;
import org.junit.jupiter.api.Test;

class RedisBlockTests {

  /** Figure out math to get the next block */
  @Test
  void getNextBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computeNextBlock(0)).isEqualTo(10);
          softly.assertThat(computeNextBlock(1)).isEqualTo(10);
          softly.assertThat(computeNextBlock(2)).isEqualTo(10);
          softly.assertThat(computeNextBlock(3)).isEqualTo(10);
          softly.assertThat(computeNextBlock(4)).isEqualTo(10);
          softly.assertThat(computeNextBlock(5)).isEqualTo(10);
          softly.assertThat(computeNextBlock(6)).isEqualTo(10);
          softly.assertThat(computeNextBlock(7)).isEqualTo(10);
          softly.assertThat(computeNextBlock(8)).isEqualTo(10);
          softly.assertThat(computeNextBlock(9)).isEqualTo(10);
          softly.assertThat(computeNextBlock(10)).isEqualTo(20);
          softly.assertThat(computeNextBlock(11)).isEqualTo(20);
          softly.assertThat(computeNextBlock(12)).isEqualTo(20);
          softly.assertThat(computeNextBlock(13)).isEqualTo(20);
          softly.assertThat(computeNextBlock(14)).isEqualTo(20);
          softly.assertThat(computeNextBlock(15)).isEqualTo(20);
          softly.assertThat(computeNextBlock(16)).isEqualTo(20);
          softly.assertThat(computeNextBlock(17)).isEqualTo(20);
          softly.assertThat(computeNextBlock(18)).isEqualTo(20);
          softly.assertThat(computeNextBlock(19)).isEqualTo(20);
          softly.assertThat(computeNextBlock(20)).isEqualTo(30);
        });
  }

  /** Figure out math to get the current block */
  @Test
  void getCurrentBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computeCurrentBlock(0)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(1)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(2)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(3)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(4)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(5)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(6)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(7)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(8)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(9)).isEqualTo(0);
          softly.assertThat(computeCurrentBlock(10)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(11)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(12)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(13)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(14)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(15)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(16)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(17)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(18)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(19)).isEqualTo(10);
          softly.assertThat(computeCurrentBlock(20)).isEqualTo(20);
        });
  }

  /** Figure out math to get the current block */
  @Test
  void getPreviousBlock() {

    assertSoftly(
        softly -> {
          softly.assertThat(computePreviousBlock(0)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(1)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(2)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(3)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(4)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(5)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(6)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(7)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(8)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(9)).isEqualTo(-10);
          softly.assertThat(computePreviousBlock(10)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(11)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(12)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(13)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(14)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(15)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(16)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(17)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(18)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(19)).isEqualTo(0);
          softly.assertThat(computePreviousBlock(20)).isEqualTo(10);
        });
  }

  private long computeNextBlock(long current) {

    return RedisKeyBlocks.computeBlock(current, 10, 1);
  }

  private long computeCurrentBlock(long current) {

    return RedisKeyBlocks.computeBlock(current, 10, 0);
  }

  private long computePreviousBlock(long current) {

    return RedisKeyBlocks.computeBlock(current, 10, -1);
  }
}
