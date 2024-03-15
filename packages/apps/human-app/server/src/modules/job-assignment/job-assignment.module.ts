import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';

@Module({
  imports: [ExchangeOracleModule],
  providers: [JobAssignmentService, JobAssignmentProfile],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule {}
