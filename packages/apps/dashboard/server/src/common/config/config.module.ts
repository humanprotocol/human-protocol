import { Module, Global } from '@nestjs/common';
import { EnvironmentConfigService } from './env-config.service';
import { RedisConfigService } from './redis-config.service';

@Global()
@Module({
  providers: [RedisConfigService, EnvironmentConfigService],
  exports: [RedisConfigService, EnvironmentConfigService],
})
export class CommonConfigModule {}
