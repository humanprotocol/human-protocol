/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  NotFound = 'Job not found',
  NotCreated = 'Job has not been created',
  NotEnoughFunds = 'Not enough funds',
  ManifestNotFound = 'Manifest not found',
  ManifestValidationFailed = 'Manifest validation failed',
  WebhookWasNotSent = 'Webhook was not sent',
}

/**
 * Represents error messages related to escrow.
 */
export enum ErrorEscrow {
  NotFound = 'Escrow not found',
  NotCreated = 'Escrow has not been created',
  NotLaunched = 'Escrow has not been launched',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found',
  AccountCannotBeRegistered = 'Account cannot be registered',
}

/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  NotFound = 'Auth not found',
  InvalidEmailOrPassword = 'Invalid email or password',
  RefreshTokenHasExpired = 'Refresh token has expired',
  UserNotActive = 'User not active',
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
  NotSuccess = 'Unsuccessful payment',
  IntentNotCreated = 'Payment intent not created',
  ClientSecretDoesNotExist = 'Payment intent does not created',
  CustomerNotFound = 'Customer not found',
  CustomerNotCreated = 'Customer not created',
  IncorrectAmount = 'Incorrect amount',
  TransactionHashAlreadyExists = 'transaction hash already exists',
  TransactionNotFoundByHash = 'Transaction not found by hash',
  InvalidTransactionData = 'Invalid transaction data',
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
