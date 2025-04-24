export type CalculatedPayout = {
  address: string;
  amount: bigint;
};

export interface EscrowPayoutsCalculator {
  calculate(): Promise<CalculatedPayout[]>;
}
