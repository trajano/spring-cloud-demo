package net.trajano.spring.cloudgateway;

import io.netty.channel.epoll.EpollDatagramChannel;
import io.netty.resolver.dns.DefaultDnsCache;
import io.netty.resolver.dns.DnsAddressResolverGroup;
import io.netty.resolver.dns.DnsNameResolverBuilder;
import org.springframework.cloud.gateway.config.HttpClientCustomizer;
import org.springframework.stereotype.Component;
import reactor.netty.http.client.HttpClient;

@Component
public class RemoveDnsCacheCustomizer implements HttpClientCustomizer {
    private final int maxTtl;

    private final int minTtl;

    private final int negativeTtl;

    public RemoveDnsCacheCustomizer() {
        this(0, 1, 0);
    }

    public RemoveDnsCacheCustomizer(int minTtl, int maxTtl, int negativeTtl) {
        this.minTtl = minTtl;
        this.maxTtl = maxTtl;
        this.negativeTtl = negativeTtl;
    }

    @Override
    public HttpClient customize(HttpClient httpClient) {
        DnsNameResolverBuilder dnsResolverBuilder = new DnsNameResolverBuilder()
            .channelFactory(EpollDatagramChannel::new)
            .resolveCache(new DefaultDnsCache(minTtl, maxTtl, negativeTtl));
        httpClient.tcpConfiguration(tcpClient -> tcpClient.resolver(new DnsAddressResolverGroup(dnsResolverBuilder)));
        return httpClient;
    }
}
