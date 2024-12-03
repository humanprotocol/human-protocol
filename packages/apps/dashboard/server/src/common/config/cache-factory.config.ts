import { CacheModuleAsyncOptions } from '@nestjs/common/cache';
import { ConfigModule } from '@nestjs/config';
import * as _ from 'lodash';
import { RedisConfigService } from './redis-config.service';
import { redisStore } from 'cache-manager-redis-yet';
import { Logger } from '@nestjs/common';

const logger = new Logger('CacheFactoryRedisStore');

const throttledRedisErrorLog = _.throttle((error) => {
  logger.error('Redis client network error', error);
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
      disableOfflineQueue: true,
    });

    store.client.on('error', throttledRedisErrorLog);

    return {
      store: () => store,
    };
  },
  inject: [RedisConfigService],
};
