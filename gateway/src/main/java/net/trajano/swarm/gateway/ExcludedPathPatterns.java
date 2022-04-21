package net.trajano.swarm.gateway;

import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.List;
import java.util.stream.Stream;

@Component
public final class ExcludedPathPatterns {

    private final List<PathPattern> excludedServerPathPatterns = Stream.of("/actuator/**", "/ping", "/favicon.ico", "**/*.css", "**/*.js", "**/*.html")
            .map(p -> new PathPatternParser().parse(p))
            .toList();

    public boolean isExcludedForServer(final PathContainer pathContainer) {

        return excludedServerPathPatterns
                .stream()
                .anyMatch(pathPattern -> pathPattern.matches(pathContainer));

    }

    public boolean isExcludedForServer(final String path) {

        return isExcludedForServer(PathContainer.parsePath(path));

    }

}
