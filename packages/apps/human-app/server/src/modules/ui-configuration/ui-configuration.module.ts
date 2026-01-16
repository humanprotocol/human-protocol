import { Module } from '@nestjs/common';
import { UiConfigurationController } from './ui-configuration.controller';
import { StakingModule } from '../staking/staking.module';

@Module({
  imports: [StakingModule],
  controllers: [UiConfigurationController],
})
export class UiConfigurationModule {}
