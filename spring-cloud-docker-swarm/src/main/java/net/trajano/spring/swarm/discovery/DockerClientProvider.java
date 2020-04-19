package net.trajano.spring.swarm.discovery;

import com.github.dockerjava.okhttp.OkHttpDockerCmdExecFactory;
import net.trajano.spring.swarm.client.DockerClient2;
import net.trajano.spring.swarm.client.DockerClientImpl2;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DockerClientProvider {
    @Bean
    public DockerClient2 dockerClient() {
        return DockerClientImpl2.getInstance()
            .withDockerCmdExecFactory(
                new OkHttpDockerCmdExecFactory()
            );
    }
}
