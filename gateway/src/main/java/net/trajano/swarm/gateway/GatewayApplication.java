package net.trajano.swarm.gateway;

import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration;
import org.springframework.cloud.client.discovery.simple.reactive.SimpleReactiveDiscoveryClientAutoConfiguration;
import reactor.core.scheduler.Schedulers;

/**
 * <a href="https://www.baeldung.com/spring-data-disable-auto-config>Exclusions</a> are done to
 * remove the simple {@link org.springframework.cloud.client.discovery.DiscoveryClient} which are
 * not used.
 */
@SpringBootApplication(
    exclude = {
      SimpleDiscoveryClientAutoConfiguration.class,
      SimpleReactiveDiscoveryClientAutoConfiguration.class
    })
public class GatewayApplication {

  public static void main(String[] args) {

    final BouncyCastleProvider bouncyCastleProvider = new BouncyCastleProvider();
    Security.insertProviderAt(bouncyCastleProvider, 1);
    //        ResourceLeakDetector.setLevel(ResourceLeakDetector.Level.PARANOID);
    Schedulers.enableMetrics();
    //    BlockHound.builder().allowBlockingCallsInside("java.util.UUID", "randomUUID").install();
    //    Schedulers.addExecutorServiceDecorator(
    //        "ABC",
    //        (scheduler, scheduledExecutorService) ->
    //            new DelegateScheduleExecutorService(scheduledExecutorService));

    SpringApplication.run(GatewayApplication.class, args);
  }
}
