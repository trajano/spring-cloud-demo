package net.trajano.spring.swarm.client;

import com.github.dockerjava.api.DockerClient;

public interface DockerClient2 extends DockerClient {

    EventsCmd2 eventsCmd2();
    //ListConfigsCmd listConfigsCmd();

}
