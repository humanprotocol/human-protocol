export enum CronJobType {
  ContentModeration = 'content-moderation',
  CreateEscrow = 'create-escrow',
  SetupEscrow = 'setup-escrow',
  FundEscrow = 'fund-escrow',
  CancelEscrow = 'cancel-escrow',
  ProcessPendingWebhook = 'process-pending-webhook',
  SyncJobStatuses = 'sync-job-statuses',
  Abuse = 'abuse',
}
