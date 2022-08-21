package net.trajano.swarm.gateway.grpc;

import java.time.Duration;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

public class ServerSentEventFunctions {
  public static String getString(ServerSentEvent<String> sse) {

    StringBuilder sb = new StringBuilder();
    String id = sse.id();
    String event = sse.event();
    Duration retry = sse.retry();
    String comment = sse.comment();
    Object data = sse.data();
    if (id != null) {
      writeField("id", id, sb);
    }
    if (event != null) {
      writeField("event", event, sb);
    }
    if (retry != null) {
      writeField("retry", retry.toMillis(), sb);
    }
    if (comment != null) {
      sb.append(':').append(StringUtils.replace(comment, "\n", "\n:")).append('\n');
    }
    if (data != null) {
      sb.append("data:");
    }

    Flux<DataBuffer> result;
    if (data == null) {
      sb.append('\n');
    } else {
      data = StringUtils.replace((String) data, "\n", "\ndata:");
      sb.append(data);
      sb.append("\n\n");
    }

    return sb.toString();
  }

  private static void writeField(String fieldName, Object fieldValue, StringBuilder sb) {
    sb.append(fieldName).append(':').append(fieldValue).append('\n');
  }
}
