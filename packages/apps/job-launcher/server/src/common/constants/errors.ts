/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  NotFound = 'Job not found',
  NotCreated = 'Job has not been created',
  NotActiveCard = 'Credit card not found. Please, add a credit card to your account.',
  ManifestNotFound = 'Manifest not found',
  ManifestValidationFailed = 'Manifest validation failed',
  ResultNotFound = 'Result not found',
  ResultValidationFailed = 'Result validation failed',
  InvalidRequestType = 'Invalid job type',
  JobParamsValidationFailed = 'Job parameters validation failed',
  InvalidEventType = 'Invalid event type',
  InvalidStatusCancellation = 'Job has an invalid status for cancellation',
  InvalidStatusCompletion = 'Job has an invalid status for completion',
  NotLaunched = 'Not launched',
  TaskDataNotFound = 'Task data not found',
  HCaptchaInvalidJobType = 'hCaptcha invalid job type',
  GroundThuthValidationFailed = 'Ground thuth validation failed',
  DatasetValidationFailed = 'Dataset validation failed',
  ManifestHashNotExist = 'Manifest hash does not exist',
  DataNotExist = 'Data does not exist',
  ImageConsistency = 'Ground Truth images not found in dataset',
  CancelWhileProcessing = 'Your job is being processed and cannot be canceled at this moment. Please, wait a few seconds and try again.',
}

/**
 * Represents error messages associated with a job moderation.
 */
export enum ErrorContentModeration {
  ErrorProcessingDataset = 'Error processing dataset',
  InappropriateContent = 'Job cannot be processed due to inappropriate content',
  ContentModerationFailed = 'Job cannot be processed due to failure in content moderation',
  NoDestinationURIFound = 'No destination URI found in the response',
  InvalidBucketUrl = 'Invalid bucket URL',
  DataMustBeStoredInGCS = 'Data must be stored in Google Cloud Storage',
  NoResultsFound = 'No results found',
  ResultsParsingFailed = 'Results parsing failed',
  JobModerationFailed = 'Job moderation failed',
  ProcessContentModerationRequestFailed = 'Process content moderation request failed',
  CompleteContentModerationFailed = 'Complete content moderation failed',
}

/**
 * Represents error messages associated to webhook.
 */
export enum ErrorWebhook {
  NotSent = 'Webhook was not sent',
  NotFound = 'Webhook not found',
  UrlNotFound = 'Webhook URL not found',
  NotCreated = 'Webhook has not been created',
  InvalidEscrow = 'Invalid escrow data provided',
}

/**
 * Represents error messages related to escrow.
 */
export enum ErrorEscrow {
  NotFound = 'Escrow not found',
  NotCreated = 'Escrow has not been created',
  NotSetup = 'Escrow has not been setup',
  NotLaunched = 'Escrow has not been launched',
  NotFunded = 'Escrow has not been funded',
  NotCanceled = 'Escrow has not been canceled',
  InvalidStatusCancellation = 'Escrow has an invalid status for cancellation',
  InvalidBalanceCancellation = 'Escrow has an invalid balance for cancellation',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found.',
  InvalidStatus = 'User has an invalid status.',
  AccountCannotBeRegistered = 'Account cannot be registered.',
  InvalidCredentials = 'Invalid credentials.',
  UserNotActive = 'User not active.',
  DuplicatedEmail = 'The email you are trying to use already exists. Please check that the email is correct or use a different email.',
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
  PasswordIsNotStrongEnough = 'Password is not strong enough. Password must be at least 8 characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character. (!@#$%^&*()_+={}|\'"/`[]:;<>,.?~-])',
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
  InvoiceNotFound = 'Invoice not found',
  NotSuccess = 'Unsuccessful payment',
  NotEnoughFunds = 'Not enough funds',
  NotDefaultPaymentMethod = 'Default payment method not found',
  IntentNotCreated = 'Payment intent not created',
  CardNotAssigned = 'Card not assigned',
  SetupNotFound = 'Setup not found',
  ClientSecretDoesNotExist = 'Client secret does not exist',
  CustomerNotFound = 'Customer not found',
  CustomerNotCreated = 'Customer not created',
  PaymentMethodInUse = 'Cannot delete the default payment method in use',
  PaymentMethodAssociationFailed = 'Payment method association failed',
  IncorrectAmount = 'Incorrect amount',
  TransactionAlreadyExists = 'Transaction already exists',
  TransactionNotFoundByHash = 'Transaction not found by hash',
  InvalidTransactionData = 'Invalid transaction data',
  TransactionHasNotEnoughAmountOfConfirmations = 'Transaction has not enough amount of confirmations',
  UnsupportedToken = 'Unsupported token',
  InvalidRecipient = 'Invalid recipient',
  ChainIdMissing = 'ChainId is missing',
  InvalidChainId = 'Invalid chain id',
  BalanceCouldNotBeRetrieved = 'User balance could not be retrieved.',
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
  InvalidGCSUrl = 'Invalid Google Cloud Storage URL',
  UrlParsingError = 'URL format is valid but cannot be parsed',
}

/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  NoValidNetworks = 'No valid networks found',
  InvalidChainId = 'Invalid chain id provided for the configured environment',
  GasPriceError = 'Error calculating gas price',
  ReputationOracleUrlNotSet = 'Reputation oracle URL not set',
}

/**
 * Represents error messages related to routing protocol.
 */
export enum ErrorRoutingProtocol {
  ReputationOracleNotFound = 'The specified Reputation Oracle address is not found in the set of available oracles. Ensure the address is correct and check available oracles for this network.',
  ExchangeOracleNotFound = 'The specified Exchange Oracle address is not found in the set of available oracles. Ensure the address is correct and part of the available oracle pool.',
  RecordingOracleNotFound = 'The specified Recording Oracle address is not found in the set of available oracles. Ensure the address is correct and part of the available oracle pool.',
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

/**
 * Represents error messages associated with a qualification.
 */
export enum ErrorQualification {
  FailedToFetchQualifications = 'Failed to fetch qualifications',
  InvalidQualification = `Invalid qualification`,
}

/**
 * Represents error messages associated with encryption.
 */
export enum ErrorEncryption {
  MissingPrivateKey = 'Encryption private key cannot be empty, when it is enabled',
}

/**
 * Represents error messages associated to storage.
 */
export enum ErrorStorage {
  FailedToDownload = 'Failed to download file',
  NotFound = 'File not found',
  InvalidUrl = 'Invalid file URL',
  FileNotUploaded = 'File not uploaded',
}
