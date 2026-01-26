import { CacheModuleAsyncOptions } from '@nestjs/common/cache';
import { ConfigModule } from '@nestjs/config';
import * as _ from 'lodash';

import KeyvRedis, { Keyv } from '@keyv/redis';
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
    const redisAdapter = new KeyvRedis({
      socket: {
        host: configService.redisHost,
        port: configService.redisPort,
      },
      database: configService.redisDbNumber,
      disableOfflineQueue: true,
    });

    redisAdapter.on('error', throttledRedisErrorLog);
    redisAdapter.client.on?.('error', throttledRedisErrorLog);

    const keyvStore = new Keyv({
      store: redisAdapter,
      namespace: undefined,
      useKeyPrefix: false,
    });

    return {
      stores: [keyvStore],
    };
  },
  inject: [RedisConfigService],
};
