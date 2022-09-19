package net.trajano.swarm.gateway.converters;

import org.jose4j.jwk.JsonWebKeySet;
import org.jose4j.lang.JoseException;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@ReadingConverter
public class StringToJsonWebKeySetConverter implements Converter<String, JsonWebKeySet> {

  @Nullable @Override
  public JsonWebKeySet convert(final String source) {

    try {
      return new JsonWebKeySet(source);
    } catch (JoseException e) {
      throw new IllegalArgumentException(e);
    }
  }
}
