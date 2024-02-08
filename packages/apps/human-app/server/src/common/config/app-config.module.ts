import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GatewayConfigService } from './gateway-config.service';
import { EnvironmentConfigService } from './environment-config.service';

@Module({
  imports: [HttpModule],
  providers: [GatewayConfigService, EnvironmentConfigService],
  exports: [GatewayConfigService, EnvironmentConfigService],
})
export class AppConfigModule {}
