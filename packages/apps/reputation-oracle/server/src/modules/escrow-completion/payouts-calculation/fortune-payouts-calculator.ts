import { CalculatedPayout, EscrowPayoutsCalculator } from './types';

export class FortunePayoutsCalculator implements EscrowPayoutsCalculator {
  async calculate(): Promise<CalculatedPayout[]> {
    throw new Error('Method not implemented.');
  }
}
