package net.trajano.swarm.gateway.discovery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.SoftAssertions.assertSoftly;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import org.junit.jupiter.api.Test;

class UtilTest {

  @Test
  void getIpAddresses() {

    assertThat(Util.getIpAddresses("google.com")).isNotEmpty();
  }

  @Test
  void getNonExistentIpAddresses() {

    assertThat(Util.getIpAddresses("gasdf.balarky")).containsExactly("gasdf.balarky");
  }

  @Test
  void getMetaDataFromLabels() {

    final var labels =
        Map.of(
            "com.docker.stack.image",
            "containous/whoami",
            "com.docker.stack.namespace",
            "ds",
            "docker.ids",
            "whoami",
            "docker.whoami.path",
            "/whoami/**",
            "docker.whoami.path.replacement",
            "/${remaining}");

    final var metaDataFromLabels = Util.getMetaDataFromLabels("docker", "whoami", true, labels);
    assertThat(metaDataFromLabels)
        .containsEntry("path.replacement", "/${remaining}")
        .containsEntry("path", "/whoami/**")
        .containsEntry("path.regexp", "/whoami/(?<remaining>.*)");
  }

  @Test
  void getMetaDataFromLabelsMultiService() {

    final var labels =
        Map.of(
            "com.docker.stack.image",
            "containous/whoami",
            "com.docker.stack.namespace",
            "ds",
            "docker.ids",
            "whoami,xxx",
            "docker.whoami.path",
            "/whoami/**",
            "docker.xxx.path",
            "/xxx/**",
            "docker.whoami.path.replacement",
            "/${remaining}");
    final var whoami = Util.getMetaDataFromLabels("docker", "whoami", true, labels);
    final var xxx = Util.getMetaDataFromLabels("docker", "xxx", true, labels);

    assertSoftly(
        softly -> {
          softly
              .assertThat(whoami)
              .containsEntry("path.replacement", "/${remaining}")
              .containsEntry("path", "/whoami/**")
              .containsEntry("path.regexp", "/whoami/(?<remaining>.*)");
          softly
              .assertThat(xxx)
              .containsEntry("path.replacement", "/${remaining}")
              .containsEntry("path", "/xxx/**")
              .containsEntry("path.regexp", "/xxx/(?<remaining>.*)");
        });
  }

  @Test
  void getMetaDataFromLabelsNoRemaining() {

    final var labels =
        Map.of(
            "com.docker.stack.image",
            "containous/whoami",
            "com.docker.stack.namespace",
            "ds",
            "docker.ids",
            "whoami",
            "docker.whoami.path",
            "/whoami/**");

    final var metaDataFromLabels = Util.getMetaDataFromLabels("docker", "whoami", true, labels);
    assertThat(metaDataFromLabels)
        .containsEntry("path.replacement", "/${remaining}")
        .containsEntry("path", "/whoami/**")
        .containsEntry("path.regexp", "/whoami/(?<remaining>.*)");
  }
}
