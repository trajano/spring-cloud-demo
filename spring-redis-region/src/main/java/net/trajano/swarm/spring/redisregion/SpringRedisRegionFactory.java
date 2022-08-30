package net.trajano.swarm.spring.redisregion;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.hibernate.boot.spi.SessionFactoryOptions;
import org.hibernate.cache.cfg.spi.DomainDataRegionBuildingContext;
import org.hibernate.cache.cfg.spi.DomainDataRegionConfig;
import org.hibernate.cache.spi.support.DomainDataStorageAccess;
import org.hibernate.cache.spi.support.RegionFactoryTemplate;
import org.hibernate.cache.spi.support.StorageAccess;
import org.hibernate.engine.spi.SessionFactoryImplementor;

public class SpringRedisRegionFactory extends RegionFactoryTemplate {

  private transient Set<DomainDataStorageAccess> storageAccesses;

  @Override
  protected DomainDataStorageAccess createDomainDataStorageAccess(
      DomainDataRegionConfig regionConfig, DomainDataRegionBuildingContext buildingContext) {

    return registerNewStorageAccess(regionConfig.getRegionName());
  }

  @Override
  protected StorageAccess createQueryResultsRegionStorageAccess(
      String regionName, SessionFactoryImplementor sessionFactory) {

    return registerNewStorageAccess(regionName);
  }

  @Override
  protected StorageAccess createTimestampsRegionStorageAccess(
      String regionName, SessionFactoryImplementor sessionFactory) {

    return registerNewStorageAccess(regionName);
  }

  @Override
  protected void prepareForUse(SessionFactoryOptions settings, Map configValues) {

    storageAccesses = ConcurrentHashMap.newKeySet();
    System.out.println(settings.getBeanManagerReference());
    System.out.println(configValues);
  }

  private DomainDataStorageAccess registerNewStorageAccess(final String regionName) {

    if (storageAccesses == null) {
      throw new IllegalStateException("prepareForUse was not executed yet");
    }
    final var storageAccess = new SpringRedisStorageAccess(regionName);
    storageAccesses.add(storageAccess);
    return storageAccess;
  }

  @Override
  protected void releaseFromUse() {

    storageAccesses.forEach(DomainDataStorageAccess::release);
  }
}
