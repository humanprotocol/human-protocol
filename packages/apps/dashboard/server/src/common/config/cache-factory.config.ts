import { CacheModuleAsyncOptions } from '@nestjs/common/cache';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import * as _ from 'lodash';

import logger from '../../logger';
import { RedisConfigService } from './redis-config.service';

const throttledRedisErrorLog = _.throttle((error) => {
  logger.error('Redis client network error', {
    context: 'CacheFactoryRedisStore',
    error,
  });
}, 1000 * 5);

export const CacheFactoryConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: RedisConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.redisHost,
        port: configService.redisPort,
      },
      database: configService.redisDbNumber,
      disableOfflineQueue: true,
    });

    store.client.on('error', throttledRedisErrorLog);

    return {
      store: () => store,
    };
  },
  inject: [RedisConfigService],
};
