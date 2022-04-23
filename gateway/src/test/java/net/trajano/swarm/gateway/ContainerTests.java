package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.common.net.HttpHeaders;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;

class ContainerTests {

  @BeforeAll
  static void setup() {

    networkName = RandomStringUtils.randomAlphabetic(20);
    network =
        Network.builder()
            .createNetworkCmdModifier(
                createNetworkCmd -> {
                  createNetworkCmd.withName(networkName);
                })
            .build();
    whoami =
        new GenericContainer<>("containous/whoami")
            .withLabel("docker.ids", "whoami")
            .withLabel("docker.whoami.path", "/whoami/**")
            .withNetwork(network)
            .withNetworkAliases("whoami")
            .withExposedPorts(80)
            .waitingFor(Wait.forLogMessage(".*Starting up on port 80.*", 1));
    redis =
        new GenericContainer<>("redis:6")
            .withNetwork(network)
            .withNetworkAliases("redis")
            .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*", 1));
    //   new ImageFromDockerfile().withDockerfile(Paths.get("../Dockerfile"))
    gateway =
        new GenericContainer<>("local/gateway")
            .dependsOn(redis, whoami)
            .withEnv("DOCKER_DISCOVERY_SWARMMODE", "false")
            .withEnv("DOCKER_DISCOVERY_NETWORK", networkName)
            .withEnv("SPRING_REDIS_HOST", "redis")
            .withFileSystemBind("/var/run/docker.sock", "/var/run/docker.sock")
            .withNetwork(network)
            .withExposedPorts(8080)
            .withLogConsumer(System.out::print)
            .waitingFor(Wait.forHealthcheck());

    whoami.start();
    redis.start();
    gateway.start();

    gatewayUrl =
        UriComponentsBuilder.newInstance()
            .scheme("http")
            .host("localhost")
            .port(gateway.getMappedPort(8080))
            .toUriString();
  }

  @AfterAll
  static void closeResources() {
    gateway.close();
    redis.close();
    whoami.close();
    network.close();
  }

  private static String gatewayUrl;
  private static String networkName;

  private static Network network;

  @Container private static GenericContainer<?> whoami;

  @Container private static GenericContainer<?> redis;

  @Container private static GenericContainer<?> gateway;

  @Test
  void whoAmIDirectly() {

    final var url =
        UriComponentsBuilder.newInstance()
            .scheme("http")
            .host("localhost")
            .port(whoami.getMappedPort(80))
            .toUriString();

    final var responseBody =
        WebTestClient.bindToServer()
            .baseUrl(url)
            .build()
            .get()
            .uri("/")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).contains("GET / HTTP/1.1");
  }

  @Test
  void noToken() {

    final var responseBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .get()
            .uri("/whoami")
            .exchange()
            .expectStatus()
            .isEqualTo(HttpStatus.UNAUTHORIZED)
            .expectHeader()
            .valueEquals(HttpHeaders.WWW_AUTHENTICATE, "Bearer realm=\"JWT\"")
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).isEqualTo("{\"ok\":false,\"error\":\"invalid_token\"}");
  }

  @Test
  void ping() {

    final var responseBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .get()
            .uri("/ping")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).isEqualTo("{\"ok\":true}");
  }
}
