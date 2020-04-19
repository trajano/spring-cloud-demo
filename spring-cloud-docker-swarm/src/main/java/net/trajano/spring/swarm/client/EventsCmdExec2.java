package net.trajano.spring.swarm.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.WebTarget;
import com.github.dockerjava.core.exec.EventsCmdExec;
import com.github.dockerjava.core.util.FiltersEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EventsCmdExec2 extends EventsCmdExec {

    private static final Logger LOGGER = LoggerFactory.getLogger(EventsCmdExec2.class);

    public EventsCmdExec2(WebTarget baseResource, DockerClientConfig dockerClientConfig) {
        super(baseResource, dockerClientConfig);
    }

    @Override
    protected Void execute0(EventsCmd command, ResultCallback<Event> resultCallback) {

        WebTarget webTarget = getBaseResource().path("/events")
            .queryParam("since", command.getSince())
            .queryParam("until", command.getUntil());

        if (command.getFilters() != null && !command.getFilters().isEmpty()) {
            webTarget = webTarget
                .queryParam("filters", FiltersEncoder.jsonEncode(command.getFilters()));
        }

        LOGGER.debug("GET: {}", webTarget);

        webTarget.request().get(new TypeReference<Event>() {
        }, resultCallback);

        return null;
    }

}
