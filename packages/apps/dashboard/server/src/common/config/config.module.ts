import { Module, Global } from '@nestjs/common';
import { EnvironmentConfigService } from './env-config.service';
import { RedisConfigService } from './redis-config.service';
import { NetworkConfigService } from './network-config.service';

@Global()
@Module({
  providers: [
    RedisConfigService,
    EnvironmentConfigService,
    NetworkConfigService,
  ],
  exports: [RedisConfigService, EnvironmentConfigService, NetworkConfigService],
})
export class CommonConfigModule {}
