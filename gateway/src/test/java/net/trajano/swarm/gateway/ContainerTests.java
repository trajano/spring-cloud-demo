package net.trajano.swarm.gateway;

import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.auth.simple.SimpleAuthenticationRequest;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;

// @Disabled
class ContainerTests {

  private static String gatewayUrl;

  private static String networkName;

  private static Network network;

  @Container private static GenericContainer<?> whoami;

  @Container private static GenericContainer<?> redis;

  @Container private static GenericContainer<?> gateway;

  @BeforeAll
  static void setup() throws Exception {

    System.out.println(new File("..").getAbsolutePath());
    final var dockerComposeBuildProcess =
        new ProcessBuilder()
            .inheritIO()
            .redirectErrorStream(true)
            .command("docker", "compose", "build")
            .directory(new File(".."))
            .start();

    assertThat(dockerComposeBuildProcess.waitFor()).isZero();
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
            .withEnv("SPRING_PROFILES_ACTIVE", "test")
            .withFileSystemBind("/var/run/docker.sock", "/var/run/docker.sock")
            .withNetwork(network)
            .withExposedPorts(8080)
            .withLogConsumer(System.out::print)
            .waitingFor(Wait.forLogMessage(".*Started GatewayApplication.*", 1));
    //                        .waitingFor(Wait.forHttp("/actuator/health"));
    //
    // .waitingFor(Wait.forHealthcheck().withStartupTimeout(Duration.ofSeconds(60)));

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

  @Test
  void authenticate() {

    final var authenticationRequest = new SimpleAuthenticationRequest();
    authenticationRequest.setAuthenticated(true);
    authenticationRequest.setUsername("gooduser");
    final var responseBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .post()
            .uri("/auth")
            .header(HttpHeaders.ACCEPT, "application/json")
            .header(HttpHeaders.CONTENT_TYPE, "application/json")
            .bodyValue(authenticationRequest)
            .exchange()
            .expectStatus()
            .isEqualTo(HttpStatus.OK)
            .expectBody(OAuthTokenResponse.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).isNotNull();
    assertThat(responseBody.isOk()).isTrue();
    assertThat(responseBody.getExpiresIn()).isEqualTo(120);
    assertThat(responseBody.getTokenType()).isEqualTo("Bearer");
  }

  @Test
  void badAuthenticate() {

    final var authenticationRequest = new SimpleAuthenticationRequest();
    authenticationRequest.setAuthenticated(false);
    authenticationRequest.setUsername("bad");
    final var responseBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .post()
            .uri("/auth")
            .bodyValue(authenticationRequest)
            .exchange()
            .expectStatus()
            .isEqualTo(HttpStatus.UNAUTHORIZED)
            .expectBody(OAuthTokenResponse.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).isNotNull();
    assertThat(responseBody.isOk()).isFalse();
    assertThat(responseBody.getError()).isEqualTo("invalid_credentials");
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
}
