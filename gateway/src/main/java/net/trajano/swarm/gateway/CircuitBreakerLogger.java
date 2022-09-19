package net.trajano.swarm.gateway;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

/** Configures the circuit breaker to log events */
@Component
@RequiredArgsConstructor
public class CircuitBreakerLogger implements InitializingBean {

  private final CircuitBreakerRegistry circuitBreakerRegistry;

  @Override
  public void afterPropertiesSet() {

    circuitBreakerRegistry
        .getAllCircuitBreakers()
        .map(CircuitBreaker::getEventPublisher)
        .forEach(this::configureCircuitBreaker);
  }

  private void configureCircuitBreaker(CircuitBreaker.EventPublisher eventPublisher) {

    eventPublisher.onStateTransition(
        event -> {
          final Logger logger =
              LoggerFactory.getLogger("circuitbreaker." + event.getCircuitBreakerName());
          logger.warn(
              "State transition from={} to={}",
              event.getStateTransition().getFromState().name(),
              event.getStateTransition().getToState().name());
        });

    eventPublisher.onError(
        event -> {
          final Logger logger =
              LoggerFactory.getLogger("circuitbreaker." + event.getCircuitBreakerName());
          logger.error(
              "{} duration={}ms",
              event.getThrowable().getMessage(),
              event.getElapsedDuration().toMillis(),
              event.getThrowable());
        });
  }
}
