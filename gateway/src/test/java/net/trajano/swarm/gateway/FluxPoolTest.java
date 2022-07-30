package net.trajano.swarm.gateway;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class FluxPoolTest {

    @Test
  void filterThen() {

    var mono = Mono.just(false).filter(i -> i);
    StepVerifier.create(mono).expectComplete().verify();
  }

  @Test
  void filterThen2() {

    var mono =
        Mono.just("mykey")
            .flatMap(
                mykey ->
                    Mono.just(false)
                        .filter(i -> i)
                        .switchIfEmpty(Mono.error(IllegalStateException::new))
                        .thenReturn(mykey))
            .flatMap(myKey -> Mono.just("SHOULD NOT GET HERE"));
    StepVerifier.create(mono).expectNextCount(0).expectError().verify();
  }
}
