package net.trajano.swarm.gateway;

import com.sun.tools.attach.spi.AttachProvider;
import java.util.Map;
import javax.management.MBeanServerConnection;
import javax.management.ObjectName;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

public class HealthProbe {

  public static void main(String[] args) throws Exception {

    final var attachProvider = AttachProvider.providers().get(0);
    final var virtualMachine = attachProvider.attachVirtualMachine("1");
    final var jmxServiceUrl = virtualMachine.startLocalManagementAgent();

    try (final var jmxConnection = JMXConnectorFactory.connect(new JMXServiceURL(jmxServiceUrl))) {
      final MBeanServerConnection serverConnection = jmxConnection.getMBeanServerConnection();

      @SuppressWarnings("unchecked")
      final var healthResult =
          (Map<String, ?>)
              serverConnection.invoke(
                  new ObjectName("org.springframework.boot:type=Endpoint,name=Health"),
                  "health",
                  new Object[0],
                  new String[0]);
      if ("UP".equals(healthResult.get("status"))) {
        System.exit(0);
      } else {
        System.exit(1);
      }
    }
  }
}
