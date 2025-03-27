import { Module } from '@nestjs/common';

import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';

import { DisableOperatorProfile } from './disable-operator.mapper.profile';
import { EnableOperatorProfile } from './enable-operator.mapper.profile';
import { OperatorService } from './operator.service';
import { OperatorProfile } from './operator.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  providers: [
    OperatorService,
    OperatorProfile,
    DisableOperatorProfile,
    EnableOperatorProfile,
  ],
  exports: [OperatorService],
})
export class OperatorModule {}
