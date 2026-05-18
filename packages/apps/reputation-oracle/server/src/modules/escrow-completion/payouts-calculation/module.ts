import { Module } from '@nestjs/common';

import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CvatPayoutsCalculator } from './cvat-payouts-calculator';
import { DefaultPayoutsCalculator } from './default-payouts-calculator';

@Module({
  imports: [StorageModule, Web3Module],
  providers: [CvatPayoutsCalculator, DefaultPayoutsCalculator],
  exports: [CvatPayoutsCalculator, DefaultPayoutsCalculator],
})
export class EscrowPayoutsCalculationModule {}
