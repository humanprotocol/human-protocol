import { CalculatedPayout, EscrowPayoutsCalculator } from './types';

export class AudinoPayoutsCalculator implements EscrowPayoutsCalculator {
  async calculate(): Promise<CalculatedPayout[]> {
    throw new Error('Method not implemented.');
  }
}
