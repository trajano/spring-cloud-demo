package net.trajano.swarm.gateway;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

public class FluxPoolTest {

  @Test
  void foo() throws Exception {

    SecureRandom secureRandom = SecureRandom.getInstanceStrong();

    final ByteBuffer refreshTokenBuffer = ByteBuffer.allocateDirect(32 * 1000);
    final AtomicInteger i = new AtomicInteger(0);
    var randomGenerator =
        Flux.<byte[]>generate(
                s -> {
                  final byte[] bytes = new byte[32];
                  secureRandom.nextBytes(bytes);
                  bytes[0] = (byte) (i.get() % 256);
                  s.next(bytes);
                })
            .publish()
            .refCount();

    final Mono<byte[]> next = randomGenerator.next();

    //        randomGenerator.next();
    StepVerifier.create(next).expectNextMatches(n -> n[0] == 0).verifyComplete();
    ;

    final Mono<byte[]> next2 = randomGenerator.next();

    StepVerifier.create(next2).expectNextMatches(n -> n[0] == 1).verifyComplete();
  }

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
