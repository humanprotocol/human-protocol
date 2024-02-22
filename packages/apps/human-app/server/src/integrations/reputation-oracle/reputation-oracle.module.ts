import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';
import { ReputationOracleProfile } from './reputation-oracle.mapper';

@Module({
  imports: [HttpModule],
  providers: [ReputationOracleGateway, ReputationOracleProfile],
  exports: [ReputationOracleGateway],
})
export class ReputationOracleModule {}
