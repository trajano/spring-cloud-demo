package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.command.ListNetworksCmd;
import com.github.dockerjava.api.command.ListServicesCmd;
import com.github.dockerjava.api.model.*;
import java.util.List;
import java.util.Map;
import net.trajano.swarm.gateway.discovery.DockerEventWatcherEventCallback;
import net.trajano.swarm.gateway.discovery.DockerServiceInstanceProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@SpringBootTest
@MockBean(
    classes = {
      DockerEventWatcherEventCallback.class,
    })
class GatewayApplicationTests {

  @TestConfiguration
  static class TestConfig {

    @Bean
    @Primary
    DockerClient mockDockerClient() {

      final var dockerClient = mock(DockerClient.class);

      final var network = mock(Network.class);
      when(network.getName()).thenReturn("services");
      when(network.getId()).thenReturn("servicesId");
      final var listNetworksCmd = mock(ListNetworksCmd.class);
      when(listNetworksCmd.exec()).thenReturn(List.of(network));
      when(listNetworksCmd.withNameFilter(anyString())).thenReturn(listNetworksCmd);
      when(dockerClient.listNetworksCmd()).thenReturn(listNetworksCmd);

      final var listServicesCmd = mock(ListServicesCmd.class);
      when(listServicesCmd.exec()).thenReturn(List.of());
      when(listServicesCmd.withLabelFilter(any(Map.class))).thenReturn(listServicesCmd);
      when(dockerClient.listServicesCmd()).thenReturn(listServicesCmd);

      final var container = mock(Container.class);
      when(container.getLabels())
          .thenReturn(
              Map.of(
                  "docker.ids", "foo",
                  "docker.foo.path", "/foo/**"));
      final var containerNetworkSettings = mock(ContainerNetworkSettings.class);
      final var containerNetwork = mock(ContainerNetwork.class);
      when(containerNetwork.getNetworkID()).thenReturn("servicesId");
      when(containerNetwork.getIpAddress()).thenReturn("127.0.0.1");
      when(containerNetworkSettings.getNetworks())
          .thenReturn(Map.of("servicesId", containerNetwork));
      when(container.getNetworkSettings()).thenReturn(containerNetworkSettings);

      final var containerPort = mock(ContainerPort.class);
      when(containerPort.getPrivatePort()).thenReturn(80);
      when(container.getPorts()).thenReturn(new ContainerPort[] {containerPort});

      final var listContainersCmd = mock(ListContainersCmd.class);
      when(listContainersCmd.exec()).thenReturn(List.of(container));
      when(listContainersCmd.withLabelFilter(any(Map.class))).thenReturn(listContainersCmd);
      when(listContainersCmd.withLabelFilter(any(List.class))).thenReturn(listContainersCmd);
      when(listContainersCmd.withNetworkFilter(any(List.class))).thenReturn(listContainersCmd);
      when(dockerClient.listContainersCmd()).thenReturn(listContainersCmd);

      final var eventsCmd = mock(EventsCmd.class);
      when(eventsCmd.withSince(anyString())).thenReturn(eventsCmd);
      when(eventsCmd.withEventTypeFilter(EventType.CONTAINER)).thenReturn(eventsCmd);
      when(dockerClient.eventsCmd()).thenReturn(eventsCmd);

      return dockerClient;
    }
  }

  @Autowired private DockerServiceInstanceProvider dockerServiceInstanceProvider;

  @Test
  void contextLoads() {}

  @Test
  void dockerServiceInstances() {
    assertThat(dockerServiceInstanceProvider.getServices()).containsExactly("foo");
    assertThat(dockerServiceInstanceProvider.getInstances("foo")).hasSize(1);
  }
}
