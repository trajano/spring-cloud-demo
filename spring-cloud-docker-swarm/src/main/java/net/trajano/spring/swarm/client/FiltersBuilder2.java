package net.trajano.spring.swarm.client;

import com.github.dockerjava.api.model.EventType;
import com.github.dockerjava.core.util.FiltersBuilder;

import java.util.stream.Collectors;
import java.util.stream.Stream;

public class FiltersBuilder2 extends FiltersBuilder {
    /**
     * Filter by event types
     *
     * @param eventTypes array of event types
     */
    public FiltersBuilder withEventTypes(EventType... eventTypes) {
        withFilter("type",
            Stream.of(eventTypes)
                .map(EventType::getValue)
                .collect(Collectors.toList()));
        return this;
    }

    /**
     * Filter by event types
     *
     * @param eventTypes array of event types
     */
    public FiltersBuilder withEventTypes(EventType2... eventTypes) {
        withFilter("type",
            Stream.of(eventTypes)
                .map(EventType2::getValue)
                .collect(Collectors.toList()));
        return this;
    }

    /**
     * Filter by networks
     *
     * @param networks array of network IDs or names
     */
    public FiltersBuilder withNetworks(String... networks) {
        withFilter("network", networks);
        return this;
    }
}
