package net.trajano.swarm.gateway.grpc;

import brave.grpc.GrpcTracing;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.grpc.MetricCollectingClientInterceptor;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

@Component
@Slf4j
@RequiredArgsConstructor
public class ChannelProvider implements DisposableBean {

  private final GrpcTracing grpcTracing;
  private final MeterRegistry meterRegistry;

  private final ExecutorService grpcExecutor =
      Executors.newFixedThreadPool(Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE);

  /**
   * Map of connections. This is presently unbounded, so maybe need to wrap this with an LRU logic
   * to prevent OOM, or simply allocate more memory.
   */
  private final Map<ConnectionKey, ManagedChannel> channelMap = new ConcurrentHashMap<>();

  /**
   * Uses the service instance rather than the connection key alone so we can add other things from
   * the meta data if needed.
   *
   * @param serviceInstance service instance
   * @return built channel
   */
  private ManagedChannel buildForServiceInstance(ServiceInstance serviceInstance) {
    final var b =
        ManagedChannelBuilder.forAddress(serviceInstance.getHost(), serviceInstance.getPort())
            //            .directExecutor()
            .enableRetry()
            .maxRetryAttempts(2)
            //            .keepAliveTime(5, TimeUnit.SECONDS)
            .intercept(grpcTracing.newClientInterceptor())
            .intercept(new MetricCollectingClientInterceptor(meterRegistry));
    if (!serviceInstance.isSecure()) {
      b.usePlaintext();
    }

    return b.build();
  }

  @Override
  public void destroy() throws Exception {
    grpcExecutor.shutdown();
  }

  public Map<String, ManagedChannel> getChannels() {
    return channelMap.entrySet().stream()
        .collect(Collectors.toMap(e -> String.valueOf(e.getKey()), Map.Entry::getValue));
  }

  /**
   * Obtains a channel from the map for the {@link ServiceInstance}.
   *
   * @param serviceInstance service instance
   * @return cached channel
   */
  public ManagedChannel obtainFor(ServiceInstance serviceInstance) {

    return channelMap.computeIfAbsent(
        new ConnectionKey(serviceInstance), i -> buildForServiceInstance(serviceInstance));
  }

  @PostConstruct
  @SuppressWarnings("unused")
  public void shutdownChannels() {

    channelMap.values().forEach(ManagedChannel::shutdown);
    for (ManagedChannel channel : channelMap.values()) {
      try {
        channel.awaitTermination(1, TimeUnit.MINUTES);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        log.error("Unable to terminate channel {}", channel);
      }
    }
  }

  private record ConnectionKey(String host, int port, boolean secure) {

    public ConnectionKey(ServiceInstance serviceInstance) {
      this(serviceInstance.getHost(), serviceInstance.getPort(), serviceInstance.isSecure());
    }
  }
}
