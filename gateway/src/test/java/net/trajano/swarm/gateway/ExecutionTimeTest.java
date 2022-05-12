package net.trajano.swarm.gateway;

import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.ParallelFlux;
import reactor.test.StepVerifier;

import java.time.Duration;

import static java.lang.System.currentTimeMillis;

class ExecutionTimeTest {
    @Test
    void reportExecutionTimeTest() {
        var stream = events()
                .flatMap(rec ->
                        processEvent(rec)
                                .transform(this::reportExecutionTime)
                );

        StepVerifier.create(stream)
                .expectNextCount(100)
                .verifyComplete();
    }

    private <T> Mono<T> reportExecutionTime(Mono<T> mono) {
        String taskStartMsKey = "task.start";

        return Mono.deferContextual(ctx -> mono
                        .doOnSuccess(__ -> {
                            var executionTime = currentTimeMillis() - ctx.<Long>get(taskStartMsKey);
                            System.out.printf("execution time: %d%n", executionTime);
                        })
                )
                .contextWrite(ctx -> ctx.put(taskStartMsKey, currentTimeMillis()));
    }

    private ParallelFlux<Integer> events() {
        return Flux.range(1, 100).parallel(10);
    }

    private Mono<Integer> processEvent(int i) {
        return Mono.delay(Duration.ofMillis(i + 100))
                .thenReturn(i);
    }
}
