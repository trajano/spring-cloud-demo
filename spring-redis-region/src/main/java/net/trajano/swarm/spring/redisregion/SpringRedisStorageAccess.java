package net.trajano.swarm.spring.redisregion;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.WeakHashMap;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.cache.spi.support.DomainDataStorageAccess;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.web.context.ContextLoader;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

@Slf4j
public class SpringRedisStorageAccess implements DomainDataStorageAccess {

  private final byte[] cacheRegionBytes;

  private final Map<Object, byte[]> serializationCache = new WeakHashMap<>();

  @Autowired private RedisConnectionFactory redisConnectionFactory;

  public SpringRedisStorageAccess(String cacheRegion) {

    this.cacheRegionBytes = cacheRegion.getBytes(StandardCharsets.UTF_8);
  }

  /**
   * @param o object
   * @return byte array representation
   */
  private static byte[] toByteArray(Object o) {

    try (final var out = new ByteArrayOutputStream();
        final var oos = new ObjectOutputStream(out)) {
      oos.writeObject(o);
      return out.toByteArray();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  /**
   * @param bytes byte array representation
   * @return object or null if there's an error
   */
  private static Object toObject(final byte[] bytes) {

    try (final var is = new ByteArrayInputStream(bytes);
        final var ois = new ObjectInputStream(is)) {
      return ois.readObject();
    } catch (IOException e) {
      log.error("IO Exception deserializing", e);
      return null;
    } catch (ClassNotFoundException e) {
      log.error("Class Not Found Exception deserializing", e);
      return null;
    }
  }

  @Override
  public boolean contains(Object key) {

    return getOptionalRedisConnection()
        .map(RedisConnection::hashCommands)
        .map(hashCommands -> hashCommands.hExists(cacheRegionBytes, toByteArrayCaching(key)))
        .orElse(false);
  }

  private Optional<RedisConnection> getOptionalRedisConnection() {

    if (redisConnectionFactory != null) {
      return Optional.of(redisConnectionFactory.getConnection());
    }
    return Optional.ofNullable(ContextLoader.getCurrentWebApplicationContext())
        .map(
            context -> {
              SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
              return redisConnectionFactory.getConnection();
            });
  }

  @Override
  public void evictData() {

    getOptionalRedisConnection()
        .map(RedisConnection::keyCommands)
        .ifPresent(keyCommands -> keyCommands.del(cacheRegionBytes));
  }

  @Override
  public void evictData(Object key) {

    getOptionalRedisConnection()
        .map(RedisConnection::hashCommands)
        .ifPresent(hashCommands -> hashCommands.hDel(cacheRegionBytes, toByteArrayCaching(key)));
  }

  @Override
  public Object getFromCache(Object key, SharedSessionContractImplementor session) {

    return getOptionalRedisConnection()
        .map(RedisConnection::hashCommands)
        .map(hashCommands -> hashCommands.hGet(cacheRegionBytes, toByteArrayCaching(key)))
        .map(SpringRedisStorageAccess::toObject)
        .orElse(null);
  }

  @Override
  public void putIntoCache(Object key, Object value, SharedSessionContractImplementor session) {

    getOptionalRedisConnection()
        .map(RedisConnection::hashCommands)
        .ifPresent(
            hashCommands ->
                hashCommands.hSet(cacheRegionBytes, toByteArrayCaching(key), toByteArray(value)));
  }

  @Override
  public void release() {

    getOptionalRedisConnection().ifPresent(RedisConnection::close);
  }

  /**
   * Specific optimization for keys that may be repeated.
   *
   * @param o object
   * @return byte array representation
   */
  private byte[] toByteArrayCaching(Object o) {

    return serializationCache.computeIfAbsent(o, SpringRedisStorageAccess::toByteArray);
  }
}
