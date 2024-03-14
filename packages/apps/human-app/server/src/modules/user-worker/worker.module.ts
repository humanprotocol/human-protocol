import { WorkerService } from './worker.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { WorkerProfile } from './worker.mapper';
import { Module } from '@nestjs/common';

@Module({
  imports: [ReputationOracleModule],
  providers: [WorkerService, WorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule {}
