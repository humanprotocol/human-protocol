import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { KvStoreModule } from '../../integrations/kv-store/kv-store.module';
import { EscrowUtilsModule } from '../../integrations/escrow/escrow-utils.module';

@Module({
  imports: [ExchangeOracleModule, KvStoreModule, EscrowUtilsModule],
  providers: [JobAssignmentService, JobAssignmentProfile],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule {}
