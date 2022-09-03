package net.trajano.swarm.gateway.converters;

import org.jose4j.jwt.JwtClaims;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
@WritingConverter
public class JwtClaimsToStringConverter implements Converter<JwtClaims, String> {

  @Nullable
  @Override
  public String convert(final JwtClaims source) {

    return source.toJson();
  }
}
