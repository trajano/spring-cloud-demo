package net.trajano.spring.cloudgateway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@RestController
public class DebugController {
    @Autowired
    private DiscoveryClient  discoveryClient;

    @GetMapping("/services")
    public Mono<Collection<String>> services() {
        return Mono.just(discoveryClient.getServices());
    }

    @GetMapping("/services/{id}")
    public Flux<ServiceInstance> serviceInstances(@PathVariable String id) {
        return Flux.fromIterable(discoveryClient.getInstances(id));
    }
}
