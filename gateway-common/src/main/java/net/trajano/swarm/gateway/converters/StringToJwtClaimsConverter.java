package net.trajano.swarm.gateway.converters;

import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@ReadingConverter
public class StringToJwtClaimsConverter implements Converter<String, JwtClaims> {

  @Nullable
  @Override
  public JwtClaims convert(final String source) {

    try {
      return JwtClaims.parse(source);
    } catch (InvalidJwtException e) {
      throw new IllegalArgumentException(e);
    }
  }
}
