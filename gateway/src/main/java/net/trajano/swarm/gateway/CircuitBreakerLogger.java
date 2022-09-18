package net.trajano.swarm.gateway;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CircuitBreakerLogger {

  private final CircuitBreakerRegistry circuitBreakerRegistry;

  private PrintWriter fos;

  @PostConstruct
  public void init() {

    try {
      fos = new PrintWriter(new FileWriter("/tmp/c.log"));
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    circuitBreakerRegistry
        .circuitBreaker("resilience")
        .getEventPublisher()
        .onStateTransition(
            event -> {
              fos.println(
                  event.getCircuitBreakerName()
                      + event.getStateTransition()
                      + event.getEventType()
                      + event.getCreationTime());
              fos.flush();
            })
        .onError(
            event -> {
              fos.println(
                  event.getCircuitBreakerName()
                      + event.getElapsedDuration()
                      + event.getEventType()
                      + event.getCreationTime()
                      + event.getThrowable());
              event.getThrowable().printStackTrace(fos);
              fos.flush();
            })
        .onEvent(
            event -> {
              fos.println(
                  event.getCircuitBreakerName() + event.getEventType() + event.getCreationTime());
            });
    ;
  }
}
