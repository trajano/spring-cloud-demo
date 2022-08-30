# Sample GRPC Service

This is a service endpoint that only provides GRPC. No web.

However, this will be accessed by Gateway which will translate HTTP requests to GRPC.
```
GET /sample/events?offset=n
```

To get a `text/event-stream` which will be done via `Flux<ServerSentEvent>`

In the back is a kafka topic with the username as part of its name.  `offset` would be the last processed offset by the
client if not specified it is the same as `latest` offset + 1 which means no new results. It can be `0` which represents
the earliest possible entry.

The kafka topic should be configured to destroy older offsets based on age and compact by keys.

The key would be a JSON array that starts with the data type and 0-to-many discriminator fields that act like
React `useEffect` dependency list parameter. This will allow replacements for similar queries via log compaction. The
key itself is `optional` in which case the data will not get compacted via key data.

```json
[
  "dataType",
  "discriminator1",
  2,
  false
]
```

Then you'd have another method

```
POST /sample/[GrpcService]/[grpcMethod]
```

The method will take a JSON message that would be converted
using [Protobuf JsonFormat](https://codeburst.io/protocol-buffers-part-3-json-format-e1ca0af27774) and sent to GRPC. The
response if any will also be converted back to JSON. Since most of the calls are going to be expected to be from POSTMAN
or some Javascript engine that won't have protobuf support there's no implementation to accept something
like `application/x-protobuf` even if it is more network efficient.

The GRPC service method will take the following message structures with the authentication data representing the sender
as part of the meta data.

```protobuf
syntax = "proto3";
message ChatRequest {
  /**
   * User name of the recipient.  The recipient must have signed in once.
   */
  string to = 1;
  /**
   * The message
   */
  string message = 2;
  /**
   * If true, the message is meant to be an announcement and there can be only one announcement.
   * This would be used as the discriminator that would allow
   */
  bool announcement = 3;
};

message ChatResponse {
  /**
   * Message ID.  This will allow deleting of the message if necessary.
   */
  string messageId = 1;
};
```

This is a request-response with pub/sub system.

Note this implementation of SSE is useful or short-lived chats not long-running persistent data. The messages cannot be
too long either. So we need to have a sync method that would get the persisted state of data. In which case the chat
history would be in a non-event data store in this example we just use Redis lists.

```protobuf
syntax = "proto3";
message ChatsRequest {
};

message ChatMessage {
  /**
   * Message ID.  This will allow deleting of the message if necessary.
   */
  string messageId = 1;
  /**
   * User ID it was sent to.
   */
  string from = 2;

  /**
   * The actual message
   */
  string message = 3;

}

message ChatMeta {
  /**
   * Announcement message.
   */
  ChatMessage announcement = 10;
}

message ChatsResponseChunk {

  oneof type {
    ChatMeta meta = 1;
    ChatMessage message = 2;
  }
};
```

## What about envoy?

I'll probably change this later to use [Envoy](https://www.envoyproxy.io/) which can do the HTTP to GRPC mapping but for now I want to determine all the parts and convert later.

## Idea

This is to leverage the capabilities of HTTP specifically caching
```
GET /sample/[GrpcService]/[grpcMethod]
```
What this would map to is a `stream` which will provide the most current data e.g.

```protobuf
service MyService {
  rpc method(Request) returns (stream CurrentView) {}
}
```

The first call (or perhaps a post construct) will map the request to the most current response.  When there's a new message from the server it will compute the JSON again and return the ETag.  The ETag will tell the client whether the data has been modified or not.

If the returns is not a stream then it's more of a permanent non-updating cache entry.
