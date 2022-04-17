package net.trajano.swarm.gateway.discovery;

import java.util.Map;
import java.util.stream.Collectors;

class Util {

    private Util() {

    }

    public static Map<String, String> getMetaDataFromLabels(String prefix, String serviceId, boolean multiId, Map<String, String> labels) {

        final var collect = labels
                .entrySet()
                .stream()
                .filter(e -> metaKey(e.getKey(), prefix, serviceId, multiId) != null)
                .collect(Collectors.toMap(e -> metaKey(e.getKey(), prefix, serviceId, multiId), Map.Entry::getValue));
        if (collect.get("path").endsWith("/**") && !collect.containsKey("path.regexp")) {
            collect.put("path.regexp", collect.get("path").replace("/**", "/(?<remaining>.*)"));
        }
        return collect;
    }

    /**
     * @param label     label
     * @param prefix    prefix
     * @param serviceId server ID
     * @param multiId   flag to indicate that the service is declared using multiple IDs.
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

}
