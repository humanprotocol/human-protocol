import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import _ from 'lodash';
import { redisStore } from 'cache-manager-redis-yet';
import Logger from '@human-protocol/logger';

import { EnvironmentConfigService } from './environment-config.service';

const logger = Logger.child({
  context: 'CacheFactoryRedisStore',
});

const throttledRedisErrorLog = _.throttle((error) => {
  logger.error('Redis client network error', error);
}, 1000 * 5);

export const CacheFactoryConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: EnvironmentConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.cacheHost,
        port: configService.cachePort,
      },
      database: configService.cacheDbNumber,
      disableOfflineQueue: true,
    });

    store.client.on('error', throttledRedisErrorLog);

    return {
      store: () => store,
    };
  },
  inject: [EnvironmentConfigService],
};
