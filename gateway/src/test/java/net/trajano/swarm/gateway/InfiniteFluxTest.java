package net.trajano.swarm.gateway;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Function;
import org.junit.jupiter.api.Test;
import org.reactivestreams.Publisher;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Signal;
import reactor.core.publisher.SignalType;
import reactor.test.StepVerifier;

class InfiniteFluxTest {

  @Test
  void erroringTest() {

    // This is the source flux which will be resubscribed if needed.
    var sourceFlux = Flux.just(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

    Consumer<Signal<Integer>> chaosMonkey =
        signal -> {
          if (signal.get() != null && signal.get() == 3) {
            throw new IllegalStateException();
          }
        };

    var testFlux = sourceFlux.doOnEach(chaosMonkey);

    StepVerifier.create(testFlux)
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectError(IllegalStateException.class)
        .verify();
  }

  @Test
  void onFirstErrorAndFirstCompleteIWillResume2() {

    var firstError = new AtomicBoolean(false);
    var completeCount = new AtomicInteger(0);
    // This is the source flux which will be resubscribed if needed.
    var sourceFlux = Flux.just(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

    Consumer<Signal<Integer>> chaosMonkey =
        signal -> {
          if (!firstError.get() && signal.get() != null && signal.get() == 3) {
            firstError.set(true);
            throw new IllegalStateException();
          }
          if (completeCount.get() < 3 && signal.getType() == SignalType.ON_COMPLETE) {
            completeCount.incrementAndGet();
            return;
          }
          if (completeCount.get() == 3 && signal.getType() == SignalType.ON_COMPLETE) {
            // since there's no way to trigger a subscription complete scenario during a test, I am
            // using this
            // to make it stop
            throw new IndexOutOfBoundsException();
          }
        };

    var testFlux = sourceFlux.doOnEach(chaosMonkey);

    Function<Throwable, Publisher<Integer>> recoverFromThrow = throwable -> testFlux;

    var recoveringFromThrowFlux =
        testFlux.onErrorResume(IllegalStateException.class, recoverFromThrow);

    var foreverFlux =
        Flux.<Flux<Integer>>generate((sink) -> sink.next(recoveringFromThrowFlux))
            .flatMap(flux -> flux);

    StepVerifier.create(foreverFlux)
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        // restart
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        // complete 0
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        // complete 1
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        // complete 2
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        // complete 3
        .expectError(IndexOutOfBoundsException.class)
        .verify();
  }

  @Test
  void onFirstErrorIWillResume() {

    var firstError = new AtomicBoolean(false);
    // This is the source flux which will be resubscribed if needed.
    var sourceFlux = Flux.just(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

    Consumer<Signal<Integer>> chaosMonkey =
        (Signal<Integer> signal) -> {
          if (!firstError.get() && signal.get() != null && signal.get() == 3) {
            firstError.set(true);
            throw new IllegalStateException();
          }
        };

    var testFlux = sourceFlux.doOnEach(chaosMonkey);

    Function<Throwable, Publisher<Integer>> recover = throwable -> testFlux;

    var recoveringFlux = testFlux.onErrorResume(recover);

    StepVerifier.create(recoveringFlux)
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        .expectComplete()
        .verify();
  }

  @Test
  void simpleTest() {

    // This is the source flux which will be resubscribed if needed.
    var sourceFlux = Flux.just(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

    StepVerifier.create(sourceFlux)
        .expectNext(0)
        .expectNext(1)
        .expectNext(2)
        .expectNext(3)
        .expectNext(4)
        .expectNext(5)
        .expectNext(6)
        .expectNext(7)
        .expectNext(8)
        .expectNext(9)
        .expectComplete()
        .verify();
  }
}
