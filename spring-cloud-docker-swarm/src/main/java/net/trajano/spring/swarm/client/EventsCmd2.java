package net.trajano.spring.swarm.client;

import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.model.EventType;

public interface EventsCmd2 extends EventsCmd {
    /**
     * @param eventTypes - event types to filter
     */
    EventsCmd2 withEventTypeFilter(EventType... eventTypes);

    /**
     * @param eventTypes - event types to filter
     */
    EventsCmd2 withEventTypeFilter(EventType2... eventTypes);

    /**
     * @param networks - networks
     */
    EventsCmd2 withNetworks(String... networks);
}
