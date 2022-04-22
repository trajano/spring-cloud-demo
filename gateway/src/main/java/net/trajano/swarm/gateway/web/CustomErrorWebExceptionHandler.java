package net.trajano.swarm.gateway.web;

import brave.Tracing;
import java.util.Map;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.AbstractErrorWebExceptionHandler;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.*;
import reactor.core.publisher.Mono;

@Component
@Order(-2)
public class CustomErrorWebExceptionHandler extends AbstractErrorWebExceptionHandler {

  private final Tracing tracing;
  /**
   * Get the HTTP error status information from the error map.
   *
   * @param errorAttributes the current error information
   * @return the error HTTP status
   */
  protected int getHttpStatus(Map<String, Object> errorAttributes) {
    return (int) errorAttributes.get("status");
  }

  /**
   * Create a new {@code AbstractErrorWebExceptionHandler}.
   *
   * @param errorAttributes the error attributes
   * @param applicationContext the application context
   * @param tracing
   * @since 2.4.0
   */
  public CustomErrorWebExceptionHandler(
      ErrorAttributes errorAttributes,
      ApplicationContext applicationContext,
      ServerCodecConfigurer serverCodecConfigurer,
      Tracing tracing) {

    super(errorAttributes, new WebProperties.Resources(), applicationContext);
    super.setMessageWriters(serverCodecConfigurer.getWriters());
    super.setMessageReaders(serverCodecConfigurer.getReaders());
    this.tracing = tracing;
  }

  @Override
  protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {

    return RouterFunctions.route(RequestPredicates.all(), this::renderErrorResponse);
  }

  private Mono<ServerResponse> renderErrorResponse(ServerRequest request) {

    int errorStatus =
        (int) getErrorAttributes(request, ErrorAttributeOptions.defaults()).get("status");
    if (errorStatus >= 400 && errorStatus < 500) {
      return ServerResponse.status(errorStatus)
          .contentType(MediaType.APPLICATION_JSON)
          .body(
              BodyInserters.fromValue(
                  GatewayResponse.builder().ok(false).error("client_error").build()));

    } else {
      return ServerResponse.status(errorStatus)
          .contentType(MediaType.APPLICATION_JSON)
          .body(BodyInserters.fromValue(GatewayResponse.builder().ok(false).build()));
    }
  }
}
