package net.trajano.swarm.gateway.datasource.redis;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.actuate.health.AbstractReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.data.redis.connection.ReactiveRedisConnection;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/** A health indicator that does an INCR operation to make sure that the redis is writable. */
@Service
public class IncrRedisReactiveHealthIndicator extends AbstractReactiveHealthIndicator
    implements InitializingBean {

  private final ReactiveRedisConnectionFactory connectionFactory;

  public IncrRedisReactiveHealthIndicator(ReactiveRedisConnectionFactory connectionFactory) {

    super("Redis health check failed");
    this.connectionFactory = connectionFactory;
  }

  /**
   * Ensures that Redis is working on startup
   *
   * @throws Exception
   */
  @Override
  public void afterPropertiesSet() throws Exception {
    health()
        .map(Health::getStatus)
        .filter(status -> status == Status.UP)
        .switchIfEmpty(Mono.error(() -> new IllegalStateException("Redis is not running")))
        .block();
  }

  @Override
  protected Mono<Health> doHealthCheck(Health.Builder builder) {

    return getConnection().flatMap((connection) -> doHealthCheck(builder, connection));
  }

  private Mono<ReactiveRedisConnection> getConnection() {

    return Mono.fromSupplier(this.connectionFactory::getReactiveConnection)
        .subscribeOn(Schedulers.boundedElastic());
  }

  private Mono<Health> doHealthCheck(Health.Builder builder, ReactiveRedisConnection connection) {

    return getHealth(builder, connection)
        .onErrorResume((ex) -> Mono.just(builder.down(ex).build()))
        .flatMap((health) -> connection.closeLater().thenReturn(health));
  }

  private Mono<Health> getHealth(Health.Builder builder, ReactiveRedisConnection connection) {

    return Mono.zip(
            connection
                .numberCommands()
                .incr(ByteBuffer.wrap("ping".getBytes(StandardCharsets.UTF_8))),
            connection
                .numberCommands()
                .incr(ByteBuffer.wrap("ping".getBytes(StandardCharsets.UTF_8))))
        .map(t -> (t.getT2() > t.getT1()) ? builder.up().build() : builder.down().build());
  }
}
