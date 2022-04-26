## Components

* `gateway` the gateway
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