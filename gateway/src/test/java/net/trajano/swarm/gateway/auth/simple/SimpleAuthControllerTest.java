package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import net.trajano.swarm.gateway.SchedulerConfiguration;
import net.trajano.swarm.gateway.auth.IdentityService;
import net.trajano.swarm.gateway.auth.IdentityServiceResponse;
import net.trajano.swarm.gateway.auth.OAuthTokenResponse;
import net.trajano.swarm.gateway.auth.claims.ClaimsService;
import net.trajano.swarm.gateway.auth.clientmanagement.NoCheckClientManagementService;
import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.jwks.JwksProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

@ContextConfiguration(
    classes = {AuthProperties.class, SimpleAuthController.class, SchedulerConfiguration.class, NoCheckClientManagementService.class})
@TestPropertySource(
    properties = {
      "simple-auth.enabled: true",
    })
@WebFluxTest(controllers = SimpleAuthController.class)
class SimpleAuthControllerTest {
  @MockBean private ClaimsService claimsService;

  @MockBean private IdentityService identityService;

  @MockBean private JwksProvider jwksProvider;

  @Autowired private WebTestClient webClient;

  @Test
  void auth() {
    final var authenticationRequest =
        SimpleAuthenticationRequest.builder().username("good").authenticated(true).build();
    final var authenticationResponse = IdentityServiceResponse.builder().ok(true).build();
    doReturn(Mono.just(authenticationResponse))
        .when(identityService)
        .authenticate(eq(authenticationRequest), any(HttpHeaders.class));

    doReturn(Mono.just(OAuthTokenResponse.builder().build()))
        .when(claimsService)
        .storeAndSignIdentityServiceResponse(authenticationResponse, null);

    webClient
        .post()
        .uri("/auth")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(authenticationRequest))
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void webClientAvailable() {
    assertThat(webClient).isNotNull();
  }
}
