/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  NotFound = 'Job not found',
  NotCreated = 'Job has not been created',
  NotEnoughFunds = 'Not enough funds',
  ManifestNotFound = 'Manifest not found',
  ManifestValidationFailed = 'Manifest validation failed',
  ResultNotFound = 'Result not found',
  ResultValidationFailed = 'Result validation failed',
  InvalidRequestType = 'Invalid job type',
  JobParamsValidationFailed = 'Job parameters validation failed',
  InvalidEventType = 'Invalid event type',
  InvalidStatusCancellation = 'Job has an invalid status for cancellation',
  NotLaunched = 'Not launched',
  TaskDataNotFound = 'Task data not found',
  HCaptchaInvalidJobType = 'hCaptcha invalid job type',
  GroundThuthValidationFailed = 'Ground thuth validation failed',
  ManifestHashNotExist = 'Manifest hash does not exist',
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
 * Represents error messages related to escrow.
 */
export enum ErrorEscrow {
  NotFound = 'Escrow not found',
  NotCreated = 'Escrow has not been created',
  NotLaunched = 'Escrow has not been launched',
  InvalidStatusCancellation = 'Escrow has an invalid status for cancellation',
  InvalidBalanceCancellation = 'Escrow has an invalid balance for cancellation',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found',
  AccountCannotBeRegistered = 'Account cannot be registered',
  BalanceCouldNotBeRetrieved = 'User balance could not be retrieved',
  InvalidCredentials = 'Invalid credentials',
  UserNotActive = 'User not active',
}

/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  NotFound = 'Token not found',
  InvalidEmailOrPassword = 'Invalid email or password',
  RefreshTokenHasExpired = 'Refresh token has expired',
  InvalidCaptchaToken = 'Invalid hcaptcha token',
  TokenExpired = 'Token has expired',
  ApiKeyCouldNotBeCreatedOrUpdated = 'API key could not be created or updated',
  ApiKeyNotFound = 'API key not found',
  PasswordIsNotStrongEnough = 'Password is not strong enough. Password must be at least eight characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character. (!@#$%^&*()_+={}|\'"/`[]:;<>,.?~-])',
  InvalidToken = 'Invalid token',
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
  ClientSecretDoesNotExist = 'Payment intent was not created',
  CustomerNotFound = 'Customer not found',
  CustomerNotCreated = 'Customer not created',
  IncorrectAmount = 'Incorrect amount',
  TransactionAlreadyExists = 'Transaction already exists',
  TransactionNotFoundByHash = 'Transaction not found by hash',
  InvalidTransactionData = 'Invalid transaction data',
  TransactionHasNotEnoughAmountOfConfirmations = 'Transaction has not enough amount of confirmations',
  UnsupportedToken = 'Unsupported token',
  InvalidRecipient = 'Invalid recipient',
  ChainIdMissing = 'ChainId is missing',
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
  NotExist = 'Bucket does not exist',
  NotPublic = 'Bucket is not public',
  UnableSaveFile = 'Unable to save file',
  InvalidProvider = 'Invalid storage provider',
  EmptyRegion = 'Region cannot be empty for this storage provider',
  InvalidRegion = 'Invalid region for the storage provider',
  EmptyBucket = 'bucketName cannot be empty',
  FailedToFetchBucketContents = 'Failed to fetch bucket contents',
}

/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  InvalidChainId = 'Invalid chain id provided for the configured environment',
  GasPriceError = 'Error calculating gas price',
}

/**
 * Represents error messages related to send grid.
 */
export enum ErrorSendGrid {
  EmailNotSent = 'Email was not sent',
  InvalidApiKey = 'Invalid SendGrid API key',
}

/**
 * Represents error messages related to signature.
 */
export enum ErrorSignature {
  SignatureNotVerified = 'Signature not verified',
  InvalidSignature = 'Invalid signature',
}

/**
 * Represents error messages related to postgres.
 */
export enum ErrorPostgres {
  NumericFieldOverflow = 'Numeric field overflow',
}

/**
 * Represents error messages associated with a cron job.
 */
export enum ErrorCronJob {
  NotCompleted = 'Cron job is not completed',
  Completed = 'Cron job is completed',
}
