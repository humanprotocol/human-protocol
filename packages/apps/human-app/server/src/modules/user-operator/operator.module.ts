import { OperatorService } from './operator.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { OperatorProfile } from './operator.mapper.profile';
import { Module } from '@nestjs/common';

@Module({
  imports: [ReputationOracleModule],
  providers: [OperatorService, OperatorProfile],
  exports: [OperatorService],
})
export class OperatorModule {}
