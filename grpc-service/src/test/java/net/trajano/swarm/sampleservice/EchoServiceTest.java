package net.trajano.swarm.sampleservice;

import static org.junit.jupiter.api.Assertions.*;

import com.google.protobuf.Struct;
import com.google.protobuf.util.JsonFormat;
import org.junit.jupiter.api.Test;

class EchoServiceTest {

  @Test
  void echo() throws Exception {
    final var jwtClaimsStruct = Struct.newBuilder();
    JsonFormat.parser()
        .merge(
            " {\n"
                + "        \"sub\": \"good\",\n"
                + "        \"exp\": 16643548160,\n"
                + "        \"iss\": \"http://localhost\",\n"
                + "        \"jti\": \"3dbecf85-d5f2-2109-5a21-0d135fb35e8a\"\n"
                + "    }",
            jwtClaimsStruct);
    System.out.println(jwtClaimsStruct.build());
  }
}
