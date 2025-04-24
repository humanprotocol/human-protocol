import { Module } from '@nestjs/common';

import { AudinoPayoutsCalculator } from './audino-payouts-calculator';
import { CvatPayoutsCalculator } from './cvat-payouts-calculator';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';

@Module({
  imports: [],
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
