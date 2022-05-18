package net.trajano.swarm.gateway.auth.simple;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

import java.net.URI;
import net.trajano.swarm.gateway.auth.oidc.WellKnownReactiveOidcService;
import org.junit.jupiter.api.Test;

class UriTest {

  @Test
  void resolve() {
    var google = URI.create("https://accounts.google.com");
    var r = WellKnownReactiveOidcService.wellKnownOpenIdConfigurationUri(google);
    assertThat(r)
        .isEqualTo(URI.create("https://accounts.google.com/.well-known/openid-configuration"));
  }

  @Test
  void resolveTenant() {
    var microsoft = URI.create("https://login.microsoftonline.com/tenant-id");
    var r = WellKnownReactiveOidcService.wellKnownOpenIdConfigurationUri(microsoft);
    assertThat(r)
        .isEqualTo(
            URI.create(
                "https://login.microsoftonline.com/tenant-id/.well-known/openid-configuration"));
  }
}
