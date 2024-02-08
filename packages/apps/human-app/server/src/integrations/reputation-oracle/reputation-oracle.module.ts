import { Module } from '@nestjs/common';
import { ReputationOracleGateway } from './reputation-oracle.gateway';
import { HttpModule } from '@nestjs/axios';
import { ReputationOracleProfile } from './reputation-oracle.mapper';
import { AppConfigModule } from '../../common/config/app-config.module';

@Module({
  imports: [HttpModule, AppConfigModule],
  providers: [ReputationOracleGateway, ReputationOracleProfile],
  exports: [ReputationOracleGateway],
})
export class ReputationOracleModule {}
