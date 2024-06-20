export enum CronJobType {
  CreateEscrow = 'create-escrow',
  SetupEscrow = 'setup-escrow',
  FundEscrow = 'fund-escrow',
  CancelEscrow = 'cancel-escrow',
  ProcessPendingWebhook = 'process-pending-webhook',
  SyncJobStatuses = 'sync-job-statuses',
}
