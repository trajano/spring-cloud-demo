package net.trajano.swarm.gateway.auth.clientmanagement;

import net.trajano.swarm.gateway.common.AuthProperties;
import net.trajano.swarm.gateway.web.InvalidClientGatewayResponse;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.ResolvableType;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ClientValidGatewayFilterFactory
    extends AbstractGatewayFilterFactory<ClientValidGatewayFilterFactory.Config> {

  private final AuthProperties authProperties;
  private final ClientManagementService clientManagementService;

  public ClientValidGatewayFilterFactory(
      final AuthProperties authProperties, final ClientManagementService clientManagementService) {

    super(ClientValidGatewayFilterFactory.Config.class);
    this.authProperties = authProperties;
    this.clientManagementService = clientManagementService;
  }

  /**
   * Provides an exchange function that will check if the client ID is valid and if not will switch
   * to an {@link InvalidClientGatewayResponse}.
   *
   * @param config config
   * @return exchange function
   */
  @Override
  public GatewayFilter apply(Config config) {

    return (exchange, chain) ->
        clientManagementService
            .obtainClientIdFromServerExchange(exchange)
            .doOnError(
                InvalidClientException.class,
                ex -> {
                  ServerWebExchangeUtils.setResponseStatus(exchange, HttpStatus.UNAUTHORIZED);
                  final var serverHttpResponse = exchange.getResponse();
                  serverHttpResponse
                      .getHeaders()
                      .add(
                          HttpHeaders.WWW_AUTHENTICATE,
                          "Basic realm=\"%s\"".formatted(authProperties.getRealm()));
                  serverHttpResponse.writeWith(
                      new Jackson2JsonEncoder()
                          .encode(
                              Mono.fromSupplier(InvalidClientGatewayResponse::new),
                              serverHttpResponse.bufferFactory(),
                              ResolvableType.forClass(InvalidClientGatewayResponse.class),
                              MediaType.APPLICATION_JSON,
                              Hints.from(Hints.LOG_PREFIX_HINT, exchange.getLogPrefix())));
                  ServerWebExchangeUtils.setAlreadyRouted(exchange);
                })
            .doOnNext(clientId -> exchange.getAttributes().put("clientId", clientId))
            .then(chain.filter(exchange));
  }

  record Config() {}
}
