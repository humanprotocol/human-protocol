import { WorkerService } from './worker.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { WorkerProfile } from './worker.mapper.profile';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { KvStoreModule } from '../../integrations/kv-store/kv-store.module';

@Module({
  imports: [ReputationOracleModule, ExchangeOracleModule, KvStoreModule],
  providers: [WorkerService, WorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule {}
