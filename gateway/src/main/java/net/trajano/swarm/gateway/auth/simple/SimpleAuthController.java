package net.trajano.swarm.gateway.auth.simple;

import net.trajano.swarm.gateway.auth.AbstractAuthController;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ConditionalOnProperty(name = "simple-auth.enabled", havingValue = "true")
public class SimpleAuthController
    extends AbstractAuthController<SimpleAuthenticationRequest, Object> {}
