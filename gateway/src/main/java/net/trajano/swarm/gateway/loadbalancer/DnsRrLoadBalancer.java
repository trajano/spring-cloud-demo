package net.trajano.swarm.gateway.loadbalancer;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.cloud.client.loadbalancer.LoadBalancerRequest;
import org.springframework.cloud.client.loadbalancer.Request;
import org.springframework.cloud.client.loadbalancer.reactive.LoadBalancerClientRequestTransformer;
import org.springframework.cloud.client.loadbalancer.reactive.ReactiveLoadBalancer;
import org.springframework.cloud.client.loadbalancer.reactive.ReactorLoadBalancerExchangeFilterFunction;

public class DnsRrLoadBalancer implements LoadBalancerClient {

  @Override
  public ServiceInstance choose(String serviceId) {

    return null;
  }

  @Override
  public <T> ServiceInstance choose(String serviceId, Request<T> request) {

    return null;
  }

  @Override
  public <T> T execute(String serviceId, LoadBalancerRequest<T> request) throws IOException {

    return null;
  }

  @Override
  public <T> T execute(
      String serviceId, ServiceInstance serviceInstance, LoadBalancerRequest<T> request)
      throws IOException {

    return null;
  }

  @Override
  public URI reconstructURI(ServiceInstance instance, URI original) {

    return null;
  }

  ReactiveLoadBalancer loadBalancer() {

    return null;
  }

  //    ReactorLoadBalancerExchangeFilterFunction

  DnsRrLoadBalancer(
      ReactiveLoadBalancer.Factory<ServiceInstance> serviceInstanceFactory,
      List<LoadBalancerClientRequestTransformer> transformers) {

    var filter =
        new ReactorLoadBalancerExchangeFilterFunction(serviceInstanceFactory, transformers);
  }
}
