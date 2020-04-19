package net.trajano.spring.swarm.config;

import net.trajano.spring.swarm.client.DockerClient2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.config.environment.Environment;
import org.springframework.cloud.config.server.environment.EnvironmentRepository;

public class DockerSwarmConfigRepository implements EnvironmentRepository {
    @Autowired
    private DockerClient2 dockerClient;
    @Override
    public Environment findOne(String application, String profile, String label) {

        return null;
    }

}
