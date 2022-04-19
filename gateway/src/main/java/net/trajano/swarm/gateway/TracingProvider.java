package net.trajano.swarm.gateway;

import brave.Tracing;
import brave.http.HttpRequestParser;
import brave.http.HttpResponseParser;
import brave.http.HttpTags;
import brave.http.HttpTracing;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TracingProvider {
  private static final Pattern SKIP_PATTERN =
      Pattern.compile("/ping|.\\.png|.\\.css|.\\.js|.\\.html|/favicon.ico");

  @Bean
  public HttpTracing httpTracing(Tracing tracing) {

    return HttpTracing.newBuilder(tracing)
        .serverRequestParser(
            (req, context, span) -> {
              HttpRequestParser.DEFAULT.parse(req, context, span);
              HttpTags.URL.tag(req, context, span);
            })
        .serverResponseParser(
            ((response, context, span) -> {
              HttpResponseParser.DEFAULT.parse(response, context, span);
              HttpTags.STATUS_CODE.tag(response, span);
            }))
        .clientRequestParser(
            (req, context, span) -> {
              HttpRequestParser.DEFAULT.parse(req, context, span);
              HttpTags.URL.tag(req, context, span); // add the url in addition to defaults
            })
        .clientResponseParser(
            ((response, context, span) -> {
              HttpResponseParser.DEFAULT.parse(response, context, span);
              HttpTags.STATUS_CODE.tag(response, span);
            }))
        .serverSampler(
            request -> {
              if (SKIP_PATTERN.matcher(request.path()).matches()) {
                return false;
              }
              return null;
            })
        .clientSampler(
            request -> {
              if (request.url().startsWith("http://daemon")) {
                return false;
              }
              return null;
            })
        .build();
  }
}
