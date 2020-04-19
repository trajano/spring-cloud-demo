package net.trajano.spring.swarm.profile;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Enable the {@code docker} profile if it detects it is running inside a Docker
 * environment.
 *
 * @see <a href="https://stackoverflow.com/a/20012536/242042">How to determine
 *      if a process runs inside lxc/Docker?</a>
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Configuration
public class DockerSwarmEnvironmentPostProcessor implements
    EnvironmentPostProcessor {

    /**
     * Pattern to locate in {@code /proc/1/cgroup} to determine if the application
     * is running in a Docker environment.
     */
    private static final Pattern DOCKER_CHECK_RE = Pattern.compile("^1:[^:]+:/docker/[0-9a-f]+");

    /**
     * Logger.
     */
    private static final Log LOG = LogFactory
        .getLog(DockerSwarmEnvironmentPostProcessor.class);

    /**
     * Profile name.
     */
    private static final String PROFILE_NAME = "docker";

    /**
     * Checks if the application is running inside a Docker container. Determination
     * of the Docker environment is done through checking {@code /proc/1/cgroup} to
     * see if the text {@code /docker/} is present in {@code 1:}.
     *
     * @return {@code true} if running inside a Docker container
     */
    private boolean isRunningInDockerContainer() {

        try (final Stream<String> matched = Files.newBufferedReader(Paths.get("/proc/1/cgroup"))
            .lines()
            .filter(c -> DOCKER_CHECK_RE.matcher(c).matches())) {
            return matched.findFirst().isPresent();
        } catch (IOException e) {
            LOG.warn("IOException trying to process /proc/1/cgroup, assuming not running in a Docker container.");
            return false;
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void postProcessEnvironment(final ConfigurableEnvironment environment,
        final SpringApplication application) {

        if (!Arrays.asList(environment.getActiveProfiles()).contains(PROFILE_NAME) && isRunningInDockerContainer()) {
            LOG.debug("Adding 'docker' profile.");
            environment.addActiveProfile(PROFILE_NAME);
        }
    }
}
