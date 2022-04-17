package net.trajano.swarm.gateway.discovery;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

class UtilTest {

    @Test
    void getMetaDataFromLabels() {

        final var labels = Map.of("com.docker.stack.image", "containous/whoami",
                "com.docker.stack.namespace", "ds",
                "docker.ids", "whoami",
                "docker.whoami.path", "/whoami/**",
                "docker.whoami.path.replacement", "/${remaining}");

        final var metaDataFromLabels = Util.getMetaDataFromLabels("docker", "whoami", true, labels);
        assertThat(metaDataFromLabels)
                .containsEntry("path.replacement", "/${remaining}")
                .containsEntry("path", "/whoami/**")
                .containsEntry("path.regexp", "/whoami/(?<remaining>.*)");
    }

}