import { Module } from '@nestjs/common';
import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';

@Module({
  imports: [ReputationOracleModule],
  controllers: [StakingController],
  providers: [StakingService],
  exports: [StakingService],
})
export class StakingModule {}
