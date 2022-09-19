package net.trajano.swarm.gateway.converters;

import org.jose4j.jwk.JsonWebKey;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@WritingConverter
public class JsonWebKeyToStringConverter implements Converter<JsonWebKey, String> {

  @Nullable @Override
  public String convert(final JsonWebKey source) {

    return source.toJson();
  }
}
