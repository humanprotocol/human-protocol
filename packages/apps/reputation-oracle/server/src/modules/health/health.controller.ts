import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import packageJson from '../../../package.json';
import { Public } from '../../common/decorators';
import { ServerConfigService } from '../../common/config/server-config.service';
import { PingResponseDto } from './dto/ping-response.dto';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly serverConfigService: ServerConfigService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
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
      gitHash: this.serverConfigService.gitHash,
    };
  }

  @ApiOperation({
    summary: 'Health check',
    description: 'Endpoint to perform health checks for the application.',
  })
  @HealthCheck()
  @Get('/check')
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> =>
        this.db.pingCheck('database', {
          timeout: 5000,
        }),
    ]);
  }
}
