import { Module } from '@nestjs/common';

import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CvatPayoutsCalculator } from './cvat-payouts-calculator';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';
import { MarketingPayoutsCalculator } from './marketing-payouts-calculator';

@Module({
  imports: [StorageModule, Web3Module],
  providers: [
    CvatPayoutsCalculator,
    FortunePayoutsCalculator,
    MarketingPayoutsCalculator,
  ],
  exports: [
    CvatPayoutsCalculator,
    FortunePayoutsCalculator,
    MarketingPayoutsCalculator,
  ],
})
export class EscrowPayoutsCalculationModule {}
