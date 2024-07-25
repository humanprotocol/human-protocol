import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_CACHE_HMT_PRICE_TTL = 60;
const DEFAULT_CACHE_HMT_GENERAL_STATS_TTL = 2 * 60;
const DEFAULT_HMT_PRICE_CACHE_KEY = 'hmt-price';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', DEFAULT_REDIS_HOST);
  }
  get redisPort(): number {
    return +this.configService.get<number>('REDIS_PORT', DEFAULT_REDIS_PORT);
  }
  get cacheHmtPriceTTL(): number {
    return +this.configService.get<number>(
      'CACHE_HMT_PRICE_TTL',
      DEFAULT_CACHE_HMT_PRICE_TTL,
    );
  }
  get cacheHmtGeneralStatsTTL(): number {
    return +this.configService.get<number>(
      'CACHE_HMT_GENERAL_STATS_TTL',
      DEFAULT_CACHE_HMT_GENERAL_STATS_TTL,
    );
  }
  get hmtPriceCacheKey(): string {
    return this.configService.get<string>(
      'HMT_PRICE_CACHE_KEY',
      DEFAULT_HMT_PRICE_CACHE_KEY,
    );
  }
}
