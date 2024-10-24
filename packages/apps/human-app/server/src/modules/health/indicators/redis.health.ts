import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    redisClient: { ping: () => Promise<string> },
  ): Promise<HealthIndicatorResult> {
    let isHealthy = false;
    try {
      await redisClient.ping();
      isHealthy = true;
    } catch (_noop) {}

    const result = this.getStatus(key, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Redis ping failed', result);
  }
}
