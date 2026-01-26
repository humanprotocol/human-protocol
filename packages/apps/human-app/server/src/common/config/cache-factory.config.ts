import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import _ from 'lodash';
import logger from '../../logger';
import { EnvironmentConfigService } from './environment-config.service';

const throttledRedisErrorLog = _.throttle((error) => {
  logger.error('Redis client network error', {
    context: 'CacheFactoryRedisStore',
    error,
  });
}, 1000 * 5);

export const CacheFactoryConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: EnvironmentConfigService) => {
    const redisAdapter = new KeyvRedis({
      socket: {
        host: configService.cacheHost,
        port: configService.cachePort,
      },
      database: configService.cacheDbNumber,
      disableOfflineQueue: true,
    });

    redisAdapter.on('error', throttledRedisErrorLog);
    redisAdapter.client?.on?.('error', throttledRedisErrorLog);

    const keyvStore = new Keyv({
      store: redisAdapter,
      namespace: undefined,
      useKeyPrefix: false,
    });

    return {
      stores: [keyvStore],
    };
  },
  inject: [EnvironmentConfigService],
};
