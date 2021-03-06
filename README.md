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

### Service example

The following is an example of how to make a service discoverable.

```yaml
service:
  whoami:
    image: containous/whoami
    deploy:
    labels:
      - spring.service.id=whoami
      - spring.service.discoverable=true
      - spring.service.port=80
      - spring.service.secure=false
 ```

Service labels control the service discovery.  These labels are

`spring.service.discoverable` explicitly specifies whether discovery should be enabled for the service.  This defaults to `true` if `spring.service.id` is present and defaults to `false` otherwise.

`spring.service.id` specifies the name of the service advertised to discovery clients.  If this is not specified, the default value is computed from the service name with the prefix value of `com.docker.stack.namespace` label and `_` removed.

`spring.service.port` is the port the service is listening on.  Swarm does not provide this information and cannot be computed from the service data of the Docker API.  This defaults to `8080` which is the default port for Spring Boot services.

`spring.service.secure` indicates whether HTTPS should be used rather than HTTP to interact with the service.  This defaults to `false`.


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