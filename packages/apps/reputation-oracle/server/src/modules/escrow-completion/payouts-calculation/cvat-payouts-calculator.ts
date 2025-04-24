import { CalculatedPayout, EscrowPayoutsCalculator } from './types';

export class CvatPayoutsCalculator implements EscrowPayoutsCalculator {
  async calculate(): Promise<CalculatedPayout[]> {
    throw new Error('Method not implemented.');
  }
}
