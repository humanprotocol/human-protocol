import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle/reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';
import { GatewayConfigService } from './gateway-config.service';
import { ReputationOracleProfile } from './reputation-oracle/reputation-oracle.mapper';

@Module({
  imports: [HttpModule],
  providers: [
    ReputationOracleGateway,
    GatewayConfigService,
    ReputationOracleProfile,
  ],
  exports: [ReputationOracleGateway, GatewayConfigService],
})
export class IntegrationsModule {}
