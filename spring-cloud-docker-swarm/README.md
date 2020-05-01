# Spring Cloud Docker Swarm

This library provides:

* a `DiscoveryClient` that works with Docker Swarm Services.
* an `EnvironmentPostProcessor` that would enable `docker` profile if it detects that the container is running in a Docker environment.

## Discovery Client

The discovery client connects to a Docker daemon

This is done through labels:

    spring.service.id: myservice

Service ID.  This is optional and will be computed from the service meta data.  However, the service metadata may not look too nice so this is provided.

    spring.service.enabled: false

Enable or disable service.  This defaults to false if service ID is not present.

    spring.service.port: 8080

The port of the registered service instance.  Defaults to `8080`

    spring.service.secure: false

Service instance uses HTTPS.  Defaults to `false`

It uses the following application properties

    docker.swarm.discovery.enabled: "true"
    
Enables functionality

    docker.swarm.discovery.networks: "mynetwork,othernetwork"
    
Specifies a comma separated list of networks to look for services that contain the service defintions.  If not specified it will use all the networks that the container has access to.

    docker.swarm.discovery.watch-delay: 100
    
Number of milliseconds representing how long a delay before trying to update the routes again.


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