import { Module } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';
import { EnvironmentConfigService } from './environment-config.service';

@Module({
  providers: [GatewayConfigService, EnvironmentConfigService],
  exports: [GatewayConfigService, EnvironmentConfigService],
})
export class AppConfigModule {}
