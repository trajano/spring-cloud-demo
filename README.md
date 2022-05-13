This complements my other project [docker-swarm-aws-terraform-module]()
## Components

* `gateway` the gateway
* `jwks-provider` generates JWKS and puts them into Redis.  There is only a single instance of this.
* `sample-service` this is a sample service endpoint that exposes HTTP, GRPC and WebSocket endpoints

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

```
artillery run gateway/src/test/artillery/functional-test.yml
artillery run -q --output report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/functional-test.yml && artillery report report.json && start report.json.html
artillery run gateway/src/test/artillery/functional-test.yml 
artillery run -q --output report.json --environment api-heavy-load gateway/src/test/artillery/functional-test.yml && artillery report report.json && start report.json.html 
artillery run --environment localhost-traefik-ludicrous-load gateway/src/test/artillery/functional-test.yml
```
