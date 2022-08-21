package net.trajano.swarm.gateway.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ChannelProvider {

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

  /**
   * Uses the service instance rather than the connection key alone so we can add other things from
   * the meta data if needed.
   *
   * @param serviceInstance service instance
   * @return built channel
   */
  private ManagedChannel buildForServiceInstance(ServiceInstance serviceInstance) {
    final var b =
        ManagedChannelBuilder.forAddress(serviceInstance.getHost(), serviceInstance.getPort());
    if (!serviceInstance.isSecure()) {
      b.usePlaintext();
    }
    return b.build();
  }

  private record ConnectionKey(String host, int port, boolean secure) {

    public ConnectionKey(ServiceInstance serviceInstance) {
      this(serviceInstance.getHost(), serviceInstance.getPort(), serviceInstance.isSecure());
    }
  }
  /**
   * Map of connections. This is presently unbounded, so maybe need to wrap this with an LRU logic
   * to prevent OOM, or simply allocate more memory.
   */
  private final Map<ConnectionKey, ManagedChannel> channelMap = new ConcurrentHashMap<>();

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
}
