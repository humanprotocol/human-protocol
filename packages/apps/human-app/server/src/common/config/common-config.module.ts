import { Module, Global } from '@nestjs/common';
import { EnvironmentConfigService } from './environment-config.service';
import { GatewayConfigService } from './gateway-config.service';

@Global()
@Module({
  providers: [GatewayConfigService, EnvironmentConfigService],
  exports: [GatewayConfigService, EnvironmentConfigService],
})
export class CommonConfigModule {}
