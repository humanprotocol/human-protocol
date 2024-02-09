import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';
import { ReputationOracleProfile } from './reputation-oracle.mapper';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { GatewayConfigService } from '../../common/config/gateway-config.service';

@Module({
  imports: [HttpModule],
  providers: [
    ReputationOracleGateway,
    ReputationOracleProfile,
    EnvironmentConfigService,
    GatewayConfigService,
  ],
  exports: [ReputationOracleGateway],
})
export class ReputationOracleModule {}
