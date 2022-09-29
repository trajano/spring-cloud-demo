package net.trajano.swarm.gateway;

import static net.trajano.swarm.gateway.grpc.GrpcFunctions.fileDescriptorForService;
import static org.assertj.core.api.Assertions.assertThat;

import com.google.protobuf.Descriptors;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import java.io.File;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.auth.simple.SimpleAuthenticationRequest;
import net.trajano.swarm.gateway.grpc.GrpcFunctions;
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

class ContainerTests {

  private static String gatewayUrl;

  private static String networkName;

  private static Network network;

  @Container private static GenericContainer<?> whoami;

  @Container private static GenericContainer<?> redis;

  @Container private static GenericContainer<?> gateway;

  /** GRPC Sample server. */
  @Container private static GenericContainer<?> grpcService;

  @Container private static GenericContainer<?> jwksProvider;

  private static ManagedChannel grpcServiceChannel;

  @BeforeAll
  static void setup() throws Exception {

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

    jwksProvider =
        new GenericContainer<>("local/jwks-provider")
            .dependsOn(redis)
            .withEnv("SPRING_REDIS_HOST", "redis")
            .withNetwork(network)
            .waitingFor(Wait.forHealthcheck());

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
            .waitingFor(Wait.forHealthcheck());

    grpcService =
        new GenericContainer<>("local/grpc-service")
            .dependsOn(redis)
            .withNetwork(network)
            .withExposedPorts(50000)
            .waitingFor(Wait.forHealthcheck());

    whoami.start();
    redis.start();
    jwksProvider.start();
    gateway.start();
    grpcService.start();

    gatewayUrl =
        UriComponentsBuilder.newInstance()
            .scheme("http")
            .host("localhost")
            .port(gateway.getMappedPort(8080))
            .toUriString();

    grpcServiceChannel =
        ManagedChannelBuilder.forAddress(grpcService.getHost(), grpcService.getMappedPort(50000))
            .directExecutor()
            .usePlaintext()
            .build();
  }

  @AfterAll
  static void closeResources() {

    grpcServiceChannel.shutdown();

    gateway.close();
    redis.close();
    whoami.close();
    jwksProvider.close();
    network.close();
    grpcService.close();
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
    assertThat(responseBody.getExpiresIn()).isLessThanOrEqualTo(120);
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

  @Test
  void grpcFunctions() {

    final var serverReflectionStub = ServerReflectionGrpc.newStub(grpcServiceChannel);
    final var block =
        GrpcFunctions.servicesFromReflection(serverReflectionStub)
            .filter(s -> !ServerReflectionGrpc.SERVICE_NAME.equals(s))
            .flatMap(service -> fileDescriptorForService(serverReflectionStub, service))
            .flatMap(
                serviceDescriptorProto ->
                    GrpcFunctions.buildServiceFromProto(
                        serverReflectionStub, serviceDescriptorProto))
            .flatMapIterable(Descriptors.FileDescriptor::getServices)
            .flatMapIterable(Descriptors.ServiceDescriptor::getMethods)
            .map(Descriptors.MethodDescriptor::toProto)
            .log()
            .blockLast();
    assertThat(block).isNotNull();
  }

  /**
   * This main method is used to trigger a test of the GRPC functions with a local server
   *
   * @param args args
   */
  public static void main(String[] args) {
    grpcServiceChannel =
        ManagedChannelBuilder.forAddress("localhost", 28088)
            .directExecutor()
            .usePlaintext()
            .build();
    new ContainerTests().grpcFunctions();
    grpcServiceChannel.shutdown();
  }
}
