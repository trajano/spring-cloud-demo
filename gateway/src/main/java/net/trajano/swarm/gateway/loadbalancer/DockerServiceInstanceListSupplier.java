package net.trajano.swarm.gateway.loadbalancer;

import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.stream.StreamSupport;
import lombok.extern.slf4j.Slf4j;
import net.trajano.swarm.gateway.discovery.DockerServiceInstanceLister;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.Request;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import org.springframework.core.env.AbstractEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.Environment;
import org.springframework.core.env.MutablePropertySources;
import reactor.core.publisher.Flux;

@Slf4j
public class DockerServiceInstanceListSupplier implements ServiceInstanceListSupplier {

  private final Environment environment;

  private final DockerServiceInstanceLister serviceInstanceProvider;

  public DockerServiceInstanceListSupplier(
      Environment environment, DockerServiceInstanceLister serviceInstanceProvider) {

    this.environment = environment;
    this.serviceInstanceProvider = serviceInstanceProvider;
  }

  @Override
  public Flux<List<ServiceInstance>> get() {
    log.info("Getting services with id " + this.getServiceId());
    return Flux.just(serviceInstanceProvider.getInstances(getServiceId()));
  }

  @Override
  public Flux<List<ServiceInstance>> get(Request request) {

    System.out.println(request);

    Properties props = new Properties();
    MutablePropertySources propSrcs = ((AbstractEnvironment) environment).getPropertySources();
    StreamSupport.stream(propSrcs.spliterator(), false)
        .filter(EnumerablePropertySource.class::isInstance)
        .map(ps -> ((EnumerablePropertySource) ps).getPropertyNames())
        .flatMap(Arrays::stream)
        .forEach(propName -> props.setProperty(propName, environment.getProperty(propName)));

    System.out.println(props);
    //    System.out.println(
    //        ((RequestDataContext) request.getContext()).getClientRequest().getAttributes());
    System.out.println(request.getClass());
    return get();
  }

  @Override
  public String getServiceId() {

    return environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
  }
}
