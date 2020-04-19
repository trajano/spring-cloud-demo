package net.trajano.spring.swarm.client;

import com.github.dockerjava.api.model.EventType;
import com.github.dockerjava.core.command.EventsCmdImpl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.google.common.base.Preconditions.checkNotNull;

public class EventsCmdImpl2 extends EventsCmdImpl implements EventsCmd2 {

    private FiltersBuilder2 filters = new FiltersBuilder2();

    public EventsCmdImpl2(Exec exec) {
        super(exec);
    }

    @Override
    public EventsCmd2 withEventTypeFilter(EventType... eventTypes) {
        checkNotNull(eventTypes, "event types have not been specified");
        this.filters.withEventTypes(eventTypes);
        return this;
    }

    @Override
    public EventsCmd2 withEventTypeFilter(EventType2... eventTypes) {
        checkNotNull(eventTypes, "event types have not been specified");
        this.filters.withEventTypes(eventTypes);
        return this;
    }

    @Override
    public EventsCmd2 withNetworks(String... networks) {
        checkNotNull(networks, "event types have not been specified");
        this.filters.withNetworks(networks);
        return this;
    }

    @Override
    public Map<String, List<String>> getFilters() {
        Map<String, List<String>> f = new HashMap<>();
        f.putAll(super.getFilters());
        f.putAll(filters.build());
        return f;
    }

}
