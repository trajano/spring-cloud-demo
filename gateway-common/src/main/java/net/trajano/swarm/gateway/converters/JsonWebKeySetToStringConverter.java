package net.trajano.swarm.gateway.converters;

import org.jose4j.jwk.JsonWebKeySet;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@WritingConverter
public class JsonWebKeySetToStringConverter implements Converter<JsonWebKeySet, String> {

  @Nullable
  @Override
  public String convert(final JsonWebKeySet source) {

    return source.toJson();
  }
}
