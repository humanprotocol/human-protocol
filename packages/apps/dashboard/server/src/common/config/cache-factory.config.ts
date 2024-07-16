import { CacheModuleAsyncOptions } from '@nestjs/common/cache';
import { ConfigModule } from '@nestjs/config';
import { RedisConfigService } from './redis-config.service';
import { redisStore } from 'cache-manager-redis-store';

export const CacheFactoryConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: RedisConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.redisHost,
        port: configService.redisPort,
      },
    });
    return {
      store: () => store,
    };
  },
  inject: [RedisConfigService],
};
