package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.apache.commons.lang3.RandomStringUtils;
import org.junit.Ignore;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Specific tests for test container itself rather than the app. */
@Testcontainers
class TestContainerTests {

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
  }

  private static String networkName;

  private static Network network;

  @Container
  private static GenericContainer<?> whoami =
      new GenericContainer<>("containous/whoami")
          .withNetwork(network)
          .withNetworkAliases("whoami")
          .withExposedPorts(80)
          .waitingFor(Wait.forLogMessage(".*Starting up on port 80.*", 1));

  /** An alpine container that is set to sleep. this is used for testing a specific scenario */
  @Container
  private GenericContainer<?> alpine =
      new GenericContainer<>("alpine").withCommand("sleep 600").withNetwork(network);

  @Test
  void testWhoAmI() {

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
  @Ignore("does not work")
  void connection() throws Exception {

    final var wget = alpine.execInContainer("wget", "-qO-", "http://whoami/");
    System.err.println(wget.getStderr());
    assertThat(wget.getStdout()).contains("GET / HTTP/1.1");
  }

  @Test
  void directlyCreate() throws Exception {

    try (Network net = Network.newNetwork();
        GenericContainer<?> foo =
            new GenericContainer<>("containous/whoami")
                .withNetwork(net)
                .withNetworkAliases("whoami")
                .withExposedPorts(80)
                .waitingFor(Wait.forLogMessage(".*Starting up on port 80.*", 1));
        GenericContainer<?> bar =
            new GenericContainer<>("alpine").withCommand("sleep 600").withNetwork(net)) {
      foo.start();
      bar.start();

      var response = bar.execInContainer("wget", "-qO-", "http://whoami");
      assertThat(response.getStdout()).contains("GET / HTTP/1.1");
    }
  }
}
