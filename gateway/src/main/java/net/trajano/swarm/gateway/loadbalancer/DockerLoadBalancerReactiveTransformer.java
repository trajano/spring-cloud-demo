package net.trajano.swarm.gateway.loadbalancer;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.reactive.LoadBalancerClientRequestTransformer;
import org.springframework.web.reactive.function.client.ClientRequest;

public class DockerLoadBalancerReactiveTransformer implements LoadBalancerClientRequestTransformer {

  @Override
  public ClientRequest transformRequest(ClientRequest request, ServiceInstance instance) {

    System.out.println(instance + " " + request.url());
    if (instance.getUri().getScheme().equals("lb")) {

      //                        try {
      //                            return InetAddress.getAllByName(instance.getUri().getHost());
      //                        } catch (IOException e) {
      //                            throw new UncheckedIOException(e);
      //                        }

      return ClientRequest.from(request)
          //                    .url()
          .build();
    } else {
      return request;
    }
  }
}
