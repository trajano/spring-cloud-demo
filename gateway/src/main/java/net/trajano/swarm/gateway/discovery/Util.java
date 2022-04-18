package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Network;
import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.xbill.DNS.ARecord;
import org.xbill.DNS.Name;
import org.xbill.DNS.Type;
import org.xbill.DNS.lookup.LookupSession;

public class Util {

  private Util() {}

  public static Network getDiscoveryNetwork(
      DockerClient dockerClient, DockerDiscoveryConfig config) {

    return dockerClient.listNetworksCmd().withNameFilter(config.getNetwork()).exec().stream()
        .filter(n -> n.getName().equals(config.getNetwork()))
        .findAny()
        .orElseThrow();
  }

  public static Map<String, String> getMetaDataFromLabels(
      String prefix, String serviceId, boolean multiId, Map<String, String> labels) {

    final var collect =
        labels.entrySet().stream()
            .filter(e -> metaKey(e.getKey(), prefix, serviceId, multiId) != null)
            .collect(
                Collectors.toMap(
                    e -> metaKey(e.getKey(), prefix, serviceId, multiId), Map.Entry::getValue));
    if (collect.get("path").endsWith("/**") && !collect.containsKey("path.regexp")) {
      collect.put("path.regexp", collect.get("path").replace("/**", "/(?<remaining>.*)"));
      if (!collect.containsKey("path.replacement")) {
        collect.put("path.replacement", "/${remaining}");
      }
    }
    return collect;
  }

  /**
   * @param label label
   * @param prefix prefix
   * @param serviceId server ID
   * @param multiId flag to indicate that the service is declared using multiple IDs.
   * @return may return {@code null}.
   */
  private static String metaKey(String label, String prefix, String serviceId, boolean multiId) {

    if (multiId) {
      if (label.startsWith(prefix + "." + serviceId + ".")) {
        return label.substring((prefix + "." + serviceId + ".").length());
      } else {
        return null;
      }
    } else {
      if (label.startsWith(prefix + ".")) {
        return label.substring((prefix + ".").length());
      } else {
        return null;
      }
    }
  }

  public static Stream<String> getServiceIdsFromLabels(
      DockerDiscoveryConfig config, Map<String, String> labels) {

    return Stream.concat(
            Stream.of(labels.get(config.idsLabel()).split(",")),
            labels.containsKey(config.idLabel())
                ? Stream.of(labels.get(config.idLabel()))
                : Stream.empty())
        .distinct();
  }

  public static Stream<String> getIpAddresses(String hostname) {

    final var s = LookupSession.defaultBuilder().clearCaches().build();
    final var name = Name.fromConstantString(hostname);
    try {
      return s.lookupAsync(name, Type.A)
          .handle(
              (r, ex) -> {
                if (r == null) {
                  return Stream.<String>empty();
                } else {
                  return r.getRecords().stream()
                      .map(ARecord.class::cast)
                      .map(ARecord::getAddress)
                      .peek(sx -> System.out.println(hostname + " " + sx))
                      .map(InetAddress::toString);
                }
              })
          .toCompletableFuture()
          .get();
    } catch (ExecutionException e) {
      throw new IllegalStateException(e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      return Stream.empty();
    }
  }
}
