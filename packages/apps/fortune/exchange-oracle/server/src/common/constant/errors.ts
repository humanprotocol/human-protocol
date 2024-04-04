/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  InvalidChainId = 'Invalid chain id provided for the configured environment',
}

/**
 * Represents error messages associated to webhook.
 */
export enum ErrorWebhook {
  NotSent = 'Webhook was not sent',
  NotFound = 'Webhook not found',
  UrlNotFound = 'Webhook URL not found',
  NotCreated = 'Webhook has not been created',
}

/**
 * Represents error messages associated with a cron job.
 */
export enum ErrorCronJob {
  NotCompleted = 'Cron job is not completed',
  Completed = 'Cron job is completed',
}
