export const DEFAULT_BULK_PAYOUT_TX_ID = 1;

export enum EscrowCompletionStatus {
  PENDING = 'pending',
  AWAITING_PAYOUTS = 'awaiting_payouts',
  PAID = 'paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
