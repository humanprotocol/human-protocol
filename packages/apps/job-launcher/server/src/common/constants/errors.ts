/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  Unauthorized = 'Unauthorized',
}

/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  NotFound = 'Job not found',
  NotCreated = 'Job has not been created',
  NotEnoughFunds = 'Not enough funds',
  ManifestNotFound = 'Manifest not found',
  WebhookWasNotReceived = 'Webhook was not received',
}

/**
 * Represents error messages related to escrow.
 */
export enum ErrorEscrow {
  NotFound = 'Escrow not found',
  NotCreated = 'Escrow has not been created',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found',
  DuplicateUsername = 'Duplicate username',
  DuplicateEmail = 'Duplicate email',
}

/**
 * Represents error messages related to token.
 */
export enum ErrorToken {
  NotFound = 'Token not found',
}

/**
 * Represents error messages related to payment.
 */
export enum ErrorPayment {
  NotFound = 'Payment not found',
  NotSuccess = 'Unseccssful payment',
  CustomerNotFound = 'Customer not found',
  IncorrectAmount = 'Incorrect amount',
  TransactionNotFoundByHash = 'Transaction not found by hash',
  TransactionHasNotEnoughAmountOfConfirmations = 'Transaction has not enough amount of confirmations',
}

/**
 * Represents error messages related to currency.
 */
export enum ErrorCurrency {
  PairNotFound = 'Pair not found',
}

/**
 * Represents error messages related to bucket.
 */
export enum ErrorBucket {
  NotPublic = 'Bucket is not public',
  UnableSaveFile = 'Unable to save file',
}
