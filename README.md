This complements my other project [docker-swarm-aws-terraform-module](https://registry.terraform.io/modules/trajano/swarm-aws/docker)
## Components

* `gateway` the gateway
* `jwks-provider` generates JWKS and puts them into Redis.  There is only a single instance of this.  This is implemented as a typical Spring Boot web application rather than WebFlux to make the implementation simpler at the expense of performance which is not needed as it is just a background process providing data.
* `sample-service` this is a sample service endpoint that exposes HTTP, SSE, and WebSocket endpoints.  This is exposed via discovery.
* `grpc-service`  this is a sample service endpoint that is GRPC directly.  This is exposed via discovery.
* `acme` this uses acme4j to provide the LetsEncrypt certificates into Redis.  It also handles the token endpoint and gateway routes to this directly, it is not exposed via discovery. **LATER**
* `redirect` this is a service that redirects GET requests to a different URL.  Primarily used to redirect from HTTP to HTTPS

* `expo-app` is a React Native app that would be used to communicate with the gateway and perform authentication.  I would rather have `nativescript` but this was easier to deal with for now due to Expo Go.
* `react-app` is a React app that would be used to communicate with the gateway and perform authentication.  This was chose in place of my prefered platform which is VueJS in order to handle a bit more code reuse for now.  I may add `vue-app` later.  I also chose CRA rather than next.js for the time being to allow me to work fully off the browser for now.

## Opening in IntelliJ

```
./gradlew openidea
```

## Auth testing

```
curl --header 'Content-Type: application/json' --data-raw '{"authenticated": false, "username":"bad"}' http://localhost:28082/auth
curl --header 'Content-Type: application/json' --data-raw '{"authenticated": true, "username":"good"}' http://localhost:28082/auth
curl http://localhost:28082/whoami
curl --header 'Authorization: Bearer BEARER' http://localhost:28082/whoami

```

## Coding conventions

* `Mono` variables and parameters are suffixed with `Mono`
* `Flux` variables and parameters are suffixed with `Flux`
* functions that provide `Mono` or `Flux` start with `provide` and it neither ends with `Mono` nor `Flux`.
* functions that are used in `map` or `flatMap` have the pattern `mapXXXtoYYY`


## Load testing

The following command should run successfully with no errors.
```
artillery run -q --output report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/happy-path.yml ; artillery report report.json && start report.json.html
artillery run -q --output report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/happy-path-no-grpc.yml ; artillery report report.json && start report.json.html
```
```
artillery run gateway/src/test/artillery/functional-test.yml
artillery run -q --output report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/functional-test.yml && artillery report report.json && start report.json.html
artillery run gateway/src/test/artillery/functional-test.yml
artillery run -q --output report.json --environment api-heavy-load gateway/src/test/artillery/functional-test.yml && artillery report report.json && start report.json.html
artillery run --environment localhost-traefik-ludicrous-load gateway/src/test/artillery/functional-test.yml
```

```
echo BASE_URL=https://api.trajano.net > .env
rm -rf node_modules/ */node_modules/ yarn.lock */yarn.lock
```
