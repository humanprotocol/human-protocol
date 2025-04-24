// TODO: Move to escrow completion module
export enum EscrowCompletionStatus {
  PENDING = 'pending',
  AWAITING_PAYOUTS = 'awaiting_payouts',
  PAID = 'paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
