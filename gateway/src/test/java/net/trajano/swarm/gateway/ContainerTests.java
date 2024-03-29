package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.protobuf.Descriptors;
import com.google.protobuf.Struct;
import com.google.protobuf.Value;
import com.google.protobuf.util.JsonFormat;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import java.io.File;
import java.time.Duration;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.auth.simple.SimpleAuthenticationRequest;
import net.trajano.swarm.gateway.grpc.GrpcServerReflection;
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
  @Container private static GenericContainer<?> zipkin;

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
        new GenericContainer<>("library/redis:6-alpine")
            .withNetwork(network)
            .withNetworkAliases("redis")
            .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*", 1));

    zipkin =
        new GenericContainer<>("openzipkin/zipkin-slim")
            .withNetwork(network)
            .withNetworkAliases("zipkin")
            .waitingFor(
                Wait.forLogMessage(".*Serving HTTP.*", 1)
                    .withStartupTimeout(Duration.ofMinutes(2)));

    jwksProvider =
        new GenericContainer<>("docker.local/jwks-provider")
            .dependsOn(redis, zipkin)
            .withEnv("SPRING_REDIS_HOST", "redis")
            .withEnv("SPRING_ZIPKIN_BASEURL", "http://zipkin:9411")
            .withEnv("SPRING_ZIPKIN_ENABLED", "false")
            .withLogConsumer(System.err::print)
            .withNetwork(network)
            .waitingFor(Wait.forHealthcheck().withStartupTimeout(Duration.ofMinutes(3)));

    grpcService =
        new GenericContainer<>("docker.local/grpc-service")
            .withEnv("SPRING_ZIPKIN_ENABLED", "false")
            .withLabel("docker.ids", "grpc")
            .withLabel("docker.grpc.path", "/grpc/**")
            .withLabel("docker.grpc.protocol", "grpc")
            .withLabel("docker.grpc.port", "50000")
            .withNetwork(network)
            .withExposedPorts(50000)
            .waitingFor(Wait.forHealthcheck().withStartupTimeout(Duration.ofMinutes(3)));

    gateway =
        new GenericContainer<>("docker.local/gateway")
            .dependsOn(redis, whoami, grpcService, jwksProvider, zipkin)
            .withEnv("DOCKER_DISCOVERY_SWARMMODE", "false")
            .withEnv("DOCKER_DISCOVERY_NETWORK", networkName)
            .withEnv("SPRING_REDIS_HOST", "redis")
            .withEnv("SPRING_PROFILES_ACTIVE", "test")
            .withEnv("SPRING_ZIPKIN_BASEURL", "http://zipkin:9411")
            .withEnv("SPRING_ZIPKIN_ENABLED", "false")
            .withFileSystemBind("/var/run/docker.sock", "/var/run/docker.sock")
            .withNetwork(network)
            .withExposedPorts(8080)
            .waitingFor(Wait.forHealthcheck().withStartupTimeout(Duration.ofMinutes(3)));

    zipkin.start();
    redis.start();
    whoami.start();

    jwksProvider.start();

    grpcService.start();

    gateway.start();

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

    if (grpcServiceChannel != null) {
      grpcServiceChannel.shutdown();
    }

    gateway.close();
    redis.close();
    whoami.close();
    jwksProvider.close();
    network.close();
    grpcService.close();
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

  @Test
  void authenticate() throws Exception {

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

    WebTestClient.bindToServer()
        .baseUrl(gatewayUrl)
        .build()
        .get()
        .uri("/whoami")
        .header(HttpHeaders.ACCEPT, "application/json")
        .header(HttpHeaders.CONTENT_TYPE, "application/json")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + responseBody.getAccessToken())
        .exchange()
        .expectStatus()
        .is3xxRedirection()
        .expectHeader()
        .valueEquals(HttpHeaders.LOCATION, gatewayUrl + "/whoami/");

    final var whoAmIBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .get()
            .uri("/whoami/")
            .header(HttpHeaders.ACCEPT, "application/json")
            .header(HttpHeaders.CONTENT_TYPE, "application/json")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + responseBody.getAccessToken())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(whoAmIBody).isNotNull();

    final var grpcBody =
        WebTestClient.bindToServer()
            .baseUrl(gatewayUrl)
            .build()
            .post()
            .uri("/grpc/Echo/echo")
            .header(HttpHeaders.ACCEPT, "application/json")
            .header(HttpHeaders.CONTENT_TYPE, "application/json")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + responseBody.getAccessToken())
            .bodyValue(
                JsonFormat.printer()
                    .print(
                        Struct.newBuilder()
                            .putFields(
                                "message", Value.newBuilder().setStringValue("Hello world").build())
                            .build()))
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(grpcBody).isNotNull().contains("Hello world");
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
  void grpcFunctions() {

    final var grpcServerReflection = new GrpcServerReflection(grpcServiceChannel);
    final var block =
        grpcServerReflection
            .servicesFromReflection()
            .filter(s -> !ServerReflectionGrpc.SERVICE_NAME.equals(s))
            .flatMap(grpcServerReflection::fileDescriptorForService)
            .flatMap(grpcServerReflection::buildServiceFromProto)
            .flatMapIterable(Descriptors.FileDescriptor::getServices)
            .flatMapIterable(Descriptors.ServiceDescriptor::getMethods)
            .map(Descriptors.MethodDescriptor::toProto)
            .log()
            .blockLast();
    assertThat(block).isNotNull();
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
            .valueEquals(
                HttpHeaders.WWW_AUTHENTICATE, "Bearer realm=\"JWT\", error=\"missing_token\"")
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();
    assertThat(responseBody).isEqualTo("{\"ok\":false,\"error\":\"missing_token\"}");
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
