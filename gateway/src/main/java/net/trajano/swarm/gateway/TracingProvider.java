package net.trajano.swarm.gateway;

import brave.Tracing;
import brave.grpc.GrpcTracing;
import brave.http.HttpRequestParser;
import brave.http.HttpResponseParser;
import brave.http.HttpTags;
import brave.http.HttpTracing;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SuppressWarnings("unused")
public class TracingProvider {

  @Bean
  GrpcTracing grpcTracing(Tracing tracing) {
    return GrpcTracing.create(tracing);
  }

  @Bean
  HttpTracing httpTracing(Tracing tracing, ExcludedPathPatterns excludedPathPatterns) {

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
              if (excludedPathPatterns.isExcludedForServer(request.path())) {
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
