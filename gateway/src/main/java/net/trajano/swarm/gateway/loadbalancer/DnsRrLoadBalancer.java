package net.trajano.swarm.gateway.loadbalancer;

import java.util.List;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.reactive.LoadBalancerClientRequestTransformer;
import org.springframework.cloud.client.loadbalancer.reactive.ReactiveLoadBalancer;
import org.springframework.cloud.client.loadbalancer.reactive.ReactorLoadBalancerExchangeFilterFunction;

public class DnsRrLoadBalancer {

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
