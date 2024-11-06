import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheManagerHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    cacheManager: Cache,
  ): Promise<HealthIndicatorResult> {
    let isHealthy = false;
    try {
      await cacheManager.get(`health-indicator-synthetic-key`);
      isHealthy = true;
    } catch (_noop) {}

    const result = this.getStatus(key, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Cache manager check failed', result);
  }
}
