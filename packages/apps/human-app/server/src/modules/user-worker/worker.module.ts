import { WorkerService } from './worker.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { WorkerProfile } from './worker.mapper.profile';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';

@Module({
  imports: [ReputationOracleModule, ExchangeOracleModule],
  providers: [WorkerService, WorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule {}
