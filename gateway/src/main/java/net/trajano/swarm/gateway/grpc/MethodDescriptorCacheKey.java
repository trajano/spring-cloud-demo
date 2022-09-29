package net.trajano.swarm.gateway.grpc;

import java.net.URI;

public record MethodDescriptorCacheKey(String serviceInstanceId, URI uri) {}
