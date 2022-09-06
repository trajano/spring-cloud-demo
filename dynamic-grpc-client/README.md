# Dynamic GRPC Client
This encapsulates a GRPC client that is dynamic.

This does this by using the reflection API from GRPC.

It should ideally have a similar API as WebClient API

```java
WebClient client = WebClient.builder()
  .baseUrl("http://localhost:8080")
  .defaultCookie("cookieKey", "cookieValue")
  .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
  .defaultUriVariables(Collections.singletonMap("url", "http://localhost:8080"))
  .build();
```

```java
DynamicGrpcClient client = DynamicGrpcClient.builder()
  .endpoint("http://localhost:50000")
  .build();
```

```java

// given a `Channel` and body
// obtain the reflection stuff
// translate JSON to the message
// send and receive
// translate message to JSON

```

This component will have no notion of Spring Cloud Gateway
