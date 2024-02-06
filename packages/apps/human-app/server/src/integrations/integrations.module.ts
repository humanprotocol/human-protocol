import { Module } from '@nestjs/common';
import { ReputationOracleService } from './reputation-oracle.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ReputationOracleService],
  exports: [ReputationOracleService],
})
export class IntegrationsModule {}
