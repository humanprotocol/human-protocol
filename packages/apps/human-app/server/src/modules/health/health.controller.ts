import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import type { RedisStore } from 'cache-manager-redis-store';

import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';

import packageJson from '../../../package.json';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { PingResponseDto } from './dto/ping-response.dto';
import { RedisHealthIndicator } from './indicators/redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly environmentConfigService: EnvironmentConfigService,
    private readonly healthCheckService: HealthCheckService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @ApiOperation({
    summary: 'Service ping',
    description:
      'Endpoint to ping service via HTTP in order to make sure it is accesible and serves proper version',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is reachable',
    type: PingResponseDto,
  })
  @ApiResponse({
    status: '5XX',
    description: 'Service is not reachable/running',
  })
  @Get('/ping')
  async ping(): Promise<PingResponseDto> {
    return {
      appName: packageJson.name,
      gitHash: this.environmentConfigService.gitHash,
    };
  }

  @Get('/check')
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description: 'Endpoint to perform health checks for the application',
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () =>
        this.redisHealthIndicator.isHealthy(
          'cache-manager-redis',
          (this.cacheManager.store as unknown as RedisStore).getClient(),
        ),
    ]);
  }
}
