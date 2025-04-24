import { Module } from '@nestjs/common';

import { StorageModule } from '../../storage/storage.module';
import { Web3Module } from '../../web3/web3.module';

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
