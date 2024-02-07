import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle/reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';
import { GatewayConfigService } from "./gateway-config.service";

@Module({
  imports: [HttpModule],
  providers: [ReputationOracleGateway, GatewayConfigService],
  exports: [ReputationOracleGateway, GatewayConfigService],
})
export class IntegrationsModule {}
