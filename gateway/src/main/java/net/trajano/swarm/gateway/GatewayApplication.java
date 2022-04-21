package net.trajano.swarm.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration;
import org.springframework.cloud.client.discovery.simple.reactive.SimpleReactiveDiscoveryClientAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

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
@EnableCaching
@EnableScheduling
public class GatewayApplication {

  public static void main(String[] args) {
    SpringApplication.run(GatewayApplication.class, args);
  }
}
