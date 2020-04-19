package net.trajano.spring.swarm.client;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

public class ConfigSpec implements Serializable {
    /**
     * @since 1.24
     */
    @JsonProperty("Name")
    private String name;

    /**
     * Data. Encoded as base64uri.
     */
    @JsonProperty("Data")
    private String data;

    /**
     * @since 1.24
     */
    @JsonProperty("Labels")
    private Map<String, String> labels;

    /**
     * @see #name
     */
    public String getName() {
        return name;
    }

    /**
     * @see #labels
     */
    public ConfigSpec withLabels(Map<String, String> labels) {
        this.labels = labels;
        return this;
    }

    /**
     * @see #data
     */
    public ConfigSpec withData(String data) {
        this.data = data;
        return this;
    }

    /**
     * @see #labels
     */
    public Map<String, String> getLabels() {
        return labels;
    }

    /**
     * This gets the decoded data.
     *
     * @return decoded data
     */
    public byte[] getData() {
        return Base64.getUrlDecoder().decode(data);
    }

    /**
     * This gets the decoded data as UTF-8 string.
     *
     * @return decoded data
     */
    public String getDataAsString() {
        return new String(getData(), StandardCharsets.UTF_8);
    }
}
