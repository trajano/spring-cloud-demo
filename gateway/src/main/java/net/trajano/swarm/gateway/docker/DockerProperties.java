package net.trajano.swarm.gateway.docker;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "docker")
@Data
public class DockerProperties {

  private String host = "unix:///var/run/docker.sock";
}
