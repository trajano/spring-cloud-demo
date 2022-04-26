package net.trajano.swarm.gateway.discovery;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Network;
import org.xbill.DNS.ARecord;
import org.xbill.DNS.Name;
import org.xbill.DNS.SimpleResolver;
import org.xbill.DNS.Type;
import org.xbill.DNS.lookup.LookupSession;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.net.InetAddress;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Util {

  private Util() {}

  public static Network getDiscoveryNetwork(
      DockerClient dockerClient, DockerDiscoveryProperties config) {

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
      DockerDiscoveryProperties config, Map<String, String> labels) {

    return Stream.concat(
            Stream.of(labels.get(config.idsLabel()).split(",")),
            labels.containsKey(config.idLabel())
                ? Stream.of(labels.get(config.idLabel()))
                : Stream.empty())
        .distinct();
  }

  public static Stream<String> getIpAddresses(String hostname) {

    try {
      final var resolver = new SimpleResolver();
      resolver.setTimeout(Duration.ofSeconds(2));
      final var s = LookupSession.defaultBuilder().clearCaches().resolver(resolver).build();
      final var name = Name.fromConstantString(hostname);
      return s.lookupAsync(name, Type.A)
          .handle(
              (r, ex) -> {
                if (r == null) {
                  // fallback is to just use the host name.  If we have another update and the
                  // service
                  // is present and listed in the DNS then we will have another look up call.
                  return Stream.of(hostname);
                } else {
                  return r.getRecords().stream()
                      .map(ARecord.class::cast)
                      .map(ARecord::getAddress)
                      .map(InetAddress::getHostAddress);
                }
              })
          .toCompletableFuture()
          .get();
    } catch (IOException | ExecutionException e) {
      throw new IllegalStateException(e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      return Stream.empty();
    }
  }
  /**
   * Convert trace ID being returned in the header to the format expected by Amazon X-Ray so we can
   * copy and paste it.
   *
   * @param traceIdString trace ID string
   * @return trace ID in AWS X-Ray format
   */
  public static String toXRay(@NotNull String traceIdString) {
    if (traceIdString.matches("[0-9a-f]{32}")) {
      return String.format("1-%s-%s", traceIdString.substring(0, 8), traceIdString.substring(8));
    } else {
      return traceIdString;
    }
  }
}
