import { Module } from '@nestjs/common';
import { DisableOperatorController } from './disable-operator.controller';
import { DisableOperatorService } from './disable-operator.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { DisableOperatorProfile } from './disable-operator.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  controllers: [DisableOperatorController],
  providers: [DisableOperatorService, DisableOperatorProfile],
})
export class DisableOperatorModule {}
