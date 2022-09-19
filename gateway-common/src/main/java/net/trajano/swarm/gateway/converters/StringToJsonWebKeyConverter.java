package net.trajano.swarm.gateway.converters;

import org.jose4j.jwk.JsonWebKey;
import org.jose4j.lang.JoseException;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@ReadingConverter
public class StringToJsonWebKeyConverter implements Converter<String, JsonWebKey> {

  @Nullable @Override
  public JsonWebKey convert(final String source) {

    try {
      return JsonWebKey.Factory.newJwk(source);
    } catch (JoseException e) {
      throw new IllegalArgumentException(e);
    }
  }
}
