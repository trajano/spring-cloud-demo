package net.trajano.swarm.gateway.grpc;

import java.io.SequenceInputStream;
import java.util.Collections;
import org.springframework.core.io.buffer.DataBuffer;
import reactor.core.publisher.Flux;

public class DataBufferFluxInputStream extends SequenceInputStream {
  public DataBufferFluxInputStream(Flux<DataBuffer> publisher, boolean releaseOnClose) {

    super(
        publisher
            .map(dataBuffer -> dataBuffer.asInputStream(releaseOnClose))
            .collectList()
            .map(Collections::enumeration)
            .block());
  }
}
