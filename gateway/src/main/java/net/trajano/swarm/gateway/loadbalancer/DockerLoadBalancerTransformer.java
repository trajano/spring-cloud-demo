package net.trajano.swarm.gateway.loadbalancer;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerRequestTransformer;
import org.springframework.http.HttpRequest;

// @Component
public class DockerLoadBalancerTransformer implements LoadBalancerRequestTransformer {

  @Override
  public HttpRequest transformRequest(HttpRequest request, ServiceInstance instance) {
    System.out.println(">" + instance + " " + request.getURI());
    return request;
  }
}
