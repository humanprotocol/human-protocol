export enum CronJobType {
  ProcessPendingIncomingWebhook = 'process-pending-incoming-webhook',
  ProcessPendingOutgoingWebhook = 'process-pending-outgoing-webhook',
  ProcessPendingEscrowCompletionTracking = 'process-pending-escrow-completion-tracking',
  ProcessPaidEscrowCompletionTracking = 'process-paid-escrow-completion-tracking',
}
