import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ReputationOracleGateway],
  exports: [ReputationOracleGateway],
})
export class IntegrationsModule {}
