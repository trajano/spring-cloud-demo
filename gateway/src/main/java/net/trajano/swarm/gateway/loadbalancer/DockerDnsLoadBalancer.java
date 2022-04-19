package net.trajano.swarm.gateway.loadbalancer;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.Request;
import org.springframework.cloud.client.loadbalancer.Response;
import org.springframework.cloud.loadbalancer.core.ReactorServiceInstanceLoadBalancer;
import reactor.core.publisher.Mono;

public class DockerDnsLoadBalancer implements ReactorServiceInstanceLoadBalancer {

  @Override
  public Mono<Response<ServiceInstance>> choose(Request request) {
    return null;
    //        return Mono.defer(()->Mono.just());
  }
}
