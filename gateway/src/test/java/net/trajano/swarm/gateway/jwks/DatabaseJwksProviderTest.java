package net.trajano.swarm.gateway.jwks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class DatabaseJwksProviderTest {

  @Test
  void cache() {

    final AtomicInteger c = new AtomicInteger(100);
    final AtomicInteger clock = new AtomicInteger(1);

    final var x =
        Mono.<Integer>create(
                sink -> {
                  sink.success(c.get());
                  c.incrementAndGet();
                })
            .log()
            .cacheInvalidateIf((i) -> clock.get() % 3 == 0);

    StepVerifier.create(x).expectNext(100).verifyComplete();

    assertThat(c.get())
        .withFailMessage("The c value was incremented when it shouldn't have")
        .isEqualTo(101);

    StepVerifier.create(x).expectNext(100).verifyComplete();

    assertThat(c.get())
        .withFailMessage("The c value was incremented when it shouldn't have")
        .isEqualTo(101);

    assertThat(clock.incrementAndGet()).isEqualTo(2);

    StepVerifier.create(x).expectNext(100).verifyComplete();

    assertThat(clock.incrementAndGet()).isEqualTo(3);
    assertThat(c.get()).isEqualTo(101);

    StepVerifier.create(x).expectNext(101).verifyComplete();

    assertThat(c.get()).withFailMessage("The c value was not incremented").isEqualTo(102);

    assertThat(clock.incrementAndGet()).isEqualTo(4);
    assertThat(c.get()).isEqualTo(102);

    StepVerifier.create(x).expectNext(101).verifyComplete();

    assertThat(clock.incrementAndGet()).isEqualTo(5);
    assertThat(c.get()).isEqualTo(102);

    StepVerifier.create(x).expectNext(101).verifyComplete();

    assertThat(clock.incrementAndGet()).isEqualTo(6);
    assertThat(c.get()).isEqualTo(102);

    StepVerifier.create(x).expectNext(102).verifyComplete();

    assertThat(c.get()).withFailMessage("The c value was not incremented").isEqualTo(103);

    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)
    //                .then(clock::incrementAndGet)
    //                .expectNext(0)        .verifyComplete();

  }

  @Test
  void boo() {

    Flux<String> source = Flux.just("thing1", "thing2");

    StepVerifier.create(appendBoomError(source))
        .expectNext("thing1")
        .expectNext("thing2")
        .expectErrorMessage("boom")
        .verify();
  }

  public <T> Flux<T> appendBoomError(Flux<T> source) {

    return source.concatWith(Mono.error(new IllegalArgumentException("boom")));
  }
}
