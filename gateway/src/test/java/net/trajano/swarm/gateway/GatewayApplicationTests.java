package net.trajano.swarm.gateway;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.command.ListNetworksCmd;
import com.github.dockerjava.api.command.ListServicesCmd;
import com.github.dockerjava.api.model.Network;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockBeans;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
class GatewayApplicationTests {

    @TestConfiguration
    static class TestConfig {

        @Bean
        @Primary
        DockerClient mockDockerClient() {

            final var dockerClient = mock(DockerClient.class);

            final var network = mock(Network.class);
            when(network.getName()).thenReturn("services");
            when(network.getId()).thenReturn("services");
            final var listNetworksCmd = mock(ListNetworksCmd.class);
            when(listNetworksCmd.exec()).thenReturn(List.of(network));
            when(listNetworksCmd.withNameFilter(anyString())).thenReturn(listNetworksCmd);
            when(dockerClient.listNetworksCmd()).thenReturn(listNetworksCmd);

            final var listServicesCmd = mock(ListServicesCmd.class);
            when(listServicesCmd.exec()).thenReturn(List.of());
            when(listServicesCmd.withLabelFilter(any(Map.class))).thenReturn(listServicesCmd);
            when(dockerClient.listServicesCmd()).thenReturn(listServicesCmd);

            final var listContainersCmd = mock(ListContainersCmd.class);
            when(listContainersCmd.exec()).thenReturn(List.of());
            when(listContainersCmd.withLabelFilter(any(Map.class))).thenReturn(listContainersCmd);
            when(listContainersCmd.withLabelFilter(any(List.class))).thenReturn(listContainersCmd);
            when(listContainersCmd.withNetworkFilter(any(List.class))).thenReturn(listContainersCmd);
            when(dockerClient.listContainersCmd()).thenReturn(listContainersCmd);

            return dockerClient;
        }

    }

    @Test
    void contextLoads() {

    }

}
