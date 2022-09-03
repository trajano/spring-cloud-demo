package net.trajano.swarm.gateway.datasource.redis;

import java.util.UUID;
import net.trajano.swarm.gateway.redis.UserSession;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface RedisUserSessions extends ReactiveCrudRepository<UserSession, UUID> {}
