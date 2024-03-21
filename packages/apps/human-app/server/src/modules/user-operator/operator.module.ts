import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { OperatorProfile } from './operator.mapper';

@Module({
  imports: [ReputationOracleModule],
  providers: [OperatorService, OperatorProfile],
  exports: [OperatorService],
})
export class OperatorModule {}
