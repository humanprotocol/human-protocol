import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { RedisConfigService } from '../../common/config/redis-config.service';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisConfigService: RedisConfigService,
  ) {}

  async getHmtPrice(): Promise<number> {
    const cachedHmtPrice: number | undefined = await this.cacheManager.get(
      this.redisConfigService.hmtPriceCacheKey,
    );
    return cachedHmtPrice;
  }

  async setHmtPrice(hmtPrice: number): Promise<void> {
    this.logger.log(`Setting a new HMT price: ${hmtPrice}`);
    await this.cacheManager.set(
      this.redisConfigService.hmtPriceCacheKey,
      hmtPrice,
      { ttl: this.redisConfigService.cacheHmtPriceTTL } as any,
    );
  }
}
