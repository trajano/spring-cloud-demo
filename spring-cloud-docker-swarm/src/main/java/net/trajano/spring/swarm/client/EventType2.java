package net.trajano.spring.swarm.client;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.HashMap;
import java.util.Map;

public enum EventType2 {
    /**
     * @since 1.24
     */
    CONTAINER("container"),

    /**
     * @since 1.24
     */
    DAEMON("daemon"),
    CONFIG("config"),
    SECRET("secret"),
    SERVICE("service"),

    /**
     * @since 1.24
     */
    IMAGE("image"),
    NETWORK("network"),
    PLUGIN("plugin"),
    VOLUME("volume");

    private static final Map<String, EventType2> EVENT_TYPES = new HashMap<>();

    static {
        for (EventType2 t : values()) {
            EVENT_TYPES.put(t.name().toLowerCase(), t);
        }
    }

    private String value;

    EventType2(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static EventType2 forValue(String s) {
        return EVENT_TYPES.get(s);
    }
}
