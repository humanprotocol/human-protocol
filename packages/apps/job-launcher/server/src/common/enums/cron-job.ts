export enum CronJobType {
  JobModeration = 'job-moderation',
  ParseJobModerationResults = 'parse-job-moderation-results',
  CreateEscrow = 'create-escrow',
  SetupEscrow = 'setup-escrow',
  FundEscrow = 'fund-escrow',
  CancelEscrow = 'cancel-escrow',
  ProcessPendingWebhook = 'process-pending-webhook',
  SyncJobStatuses = 'sync-job-statuses',
  Abuse = 'abuse',
}
