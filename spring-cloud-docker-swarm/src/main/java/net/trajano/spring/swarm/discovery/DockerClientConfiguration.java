package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.okhttp.OkHttpDockerCmdExecFactory;
import net.trajano.spring.swarm.client.DockerClient2;
import net.trajano.spring.swarm.client.DockerClientImpl2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DockerClientConfiguration {
    @Autowired
    private DockerSwarmDiscoveryProperties properties;

    @Bean
    public DockerClient2 dockerClient() {
        return DockerClientImpl2.getInstance(properties.getDaemonUri())
            .withDockerCmdExecFactory(
                new OkHttpDockerCmdExecFactory()
            );
    }
}
