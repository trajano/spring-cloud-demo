package net.trajano.swarm.gateway.auth.simple;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.EventsCmd;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.command.ListNetworksCmd;
import com.github.dockerjava.api.command.ListServicesCmd;
import com.github.dockerjava.api.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest(
        classes={RedisAuthCache.class, SimpleAuthServiceProperties.class, RedisKeyBlocks.class, RedisAuthCacheTest.TestConfig.class}
)
class RedisAuthCacheTest {

    @TestConfiguration
    static class TestConfig {


        @Bean
        @Primary
        ReactiveStringRedisTemplate mockReactiveStringRedisTemplate() {

            final var reactiveStringRedisTemplate = mock(ReactiveStringRedisTemplate.class);
            when(reactiveStringRedisTemplate.hasKey(anyString())).thenReturn(Mono.just(false));
            return reactiveStringRedisTemplate;
        }
    }

    @Autowired
    RedisAuthCache redisAuthCache;
    @Test
    void provideRefreshToken() {

        final var stringMono = redisAuthCache.provideRefreshToken();
        assertThat(redisAuthCache.isRefreshTokenValid(stringMono.block())).isTrue();
        assertThat(redisAuthCache.isRefreshTokenValid("ABC")).isFalse();
    }

}