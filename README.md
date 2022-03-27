# Spring Cloud Docker Swarm

This provides:

* a `DiscoveryClient` that works with Docker Swarm Services
* an `EnvironmentPostProcessor` that would enable `docker` profile if it detects that the container is running in a Docker environment.

## Discovery Client

The Docker Swarm `DiscoveryClient` and `ReactiveDiscoveryClient` is meant to be used when the service do not expect to know what other services exist.  The best use case for this would be Spring Cloud Gateway.  

This is not meant to replace Docker Swarm's load balancing or internal DNS registrations.  As such do not use it to discover the `configserver` it is best that services look that up using the Docker DNS, but the library does support `spring.cloud.config.discovery.enabled=true`.

The Docker daemon needs to be exposed to service is another reason why this library should not be used for discovery.

### Configuration

It uses the following application properties

    docker.swarm.discovery.enabled: "true"
    
Enables or disables functionality.  By default, if the library is present and discovery is enabled, autoconfigure will enable discovery from Docker Swarm.

    docker.swarm.discovery.daemon-uri: "unix:///var/run/docker.sock"
    
This is the Docker daemon URI.  This defaults to `unix:///var/run/docker.sock` which is expected to be on a manager node.  **tecnativa/docker-socket-proxy** can be used to proxy the daemon from the manager node to worker nodes for better scaling and security as it will ensure read-only operations are performed on the Docker daemon.

    docker.swarm.discovery.networks: "mynetwork,othernetwork"
    
Specifies a comma separated list of networks to look for services that contain the service labels. If not specified it will use all the networks that the container has access to.

    docker.swarm.discovery.label.prefix: "spring.service"

Specifies the prefix for the labels with *NO* trailing `.`.  Defaults to `spring.service`

### Service example

The following is an example of how to make a service discoverable.

```yaml
service:
  whoami:
    image: containous/whoami
    deploy:
    labels:
      - spring.service.ids=whoami
      - spring.service.whoami.port=80
      - spring.service.whoami.secure=false
      - spring.service.whoami.predicates.0=Path=/whoami/{segment}
      - spring.service.whoami.filters.0=/{segment}
 ```

Service labels control the service discovery.  These labels are

`spring.service.ids` specifies a comma separated list of names of the services advertised to discovery clients.  If this is not specified, then the service is not eligible for discovery.

`spring.service.<id>.port` is the port the service is listening on.  Swarm does not provide this information and cannot be computed from the service data of the Docker API.  This defaults to `8080` which is the default port for Spring Boot services.

`spring.service.<id>.secure` indicates whether HTTPS should be used rather than HTTP to interact with the service.  This defaults to `false`.
`spring.service.<id>.preidcates.<index>` Specifies the predicates to route to this service.
`spring.service.<id>.filters.<index>` Specifies the filters to apply to the service


## Note

* This cannot be used to detect the config server.  In a swarm, it is best that the config server is referenced directly by setting the following in bootstrap.yml of the service or through the environment variable.

    ```yaml
    spring:
      cloud.config.uri: http://configserver:8080/
    ```

## Testing notes

* Creating an insecure Docker connection for local testing

    docker run --rm -d -v /var/run/docker.sock:/var/run/docker.sock -p 2375:2375 alpine/socat tcp-listen:2375,fork,reuseaddr unix-connect:/var/run/docker.sock 
    docker service create -d --name daemon --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock -p 2375:2375 alpine/socat tcp-listen:2375,fork,reuseaddr unix-connect:/var/run/docker.sock