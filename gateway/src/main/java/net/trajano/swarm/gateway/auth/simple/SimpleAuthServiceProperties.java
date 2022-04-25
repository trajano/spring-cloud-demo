package net.trajano.swarm.gateway.auth.simple;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties("simple-auth")
public class SimpleAuthServiceProperties {}
