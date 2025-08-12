import { Module } from '@nestjs/common';

import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { AudinoPayoutsCalculator } from './audino-payouts-calculator';
import { CvatPayoutsCalculator } from './cvat-payouts-calculator';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';

@Module({
  imports: [StorageModule, Web3Module],
  providers: [
    AudinoPayoutsCalculator,
    CvatPayoutsCalculator,
    FortunePayoutsCalculator,
  ],
  exports: [
    AudinoPayoutsCalculator,
    CvatPayoutsCalculator,
    FortunePayoutsCalculator,
  ],
})
export class EscrowPayoutsCalculationModule {}
