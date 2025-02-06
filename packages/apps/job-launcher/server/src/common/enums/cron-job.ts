export enum CronJobType {
  JobModeration = 'job-moderation',
  ProcessJobModerationTasks = 'process-job-moderation-tasks',
  ParseJobModerationResults = 'parse-job-moderation-results',
  CompleteJobModeration = 'complete-job-moderation',
  CreateEscrow = 'create-escrow',
  SetupEscrow = 'setup-escrow',
  FundEscrow = 'fund-escrow',
  CancelEscrow = 'cancel-escrow',
  ProcessPendingWebhook = 'process-pending-webhook',
  SyncJobStatuses = 'sync-job-statuses',
  Abuse = 'abuse',
}
