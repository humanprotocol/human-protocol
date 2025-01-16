/**
 * Represents error messages related to escrow completion.
 */
export enum ErrorEscrowCompletion {
  NotFound = 'Escrow completion not found',
  NotCreated = 'Escrow completion has not been created',
  PendingProcessingFailed = 'Failed to process pending escrow completion',
  PaidProcessingFailed = 'Failed to process paid escrow completion',
  AwaitingPayoutsProcessingFailed = 'Failed to process payouts for escrow completion',
}

/**
 * Represents error messages related to results.
 */
export enum ErrorResults {
  IntermediateResultsURLNotSet = 'Intermediate results URL is not set',
  NoIntermediateResultsFound = 'No intermediate results found',
  NoAnnotationsMetaFound = 'No annotations meta found',
  NoResultsHaveBeenVerified = 'No results have been verified',
  NotAllRequiredSolutionsHaveBeenSent = 'Not all required solutions have been sent',
}

/**
 * Represents error messages related to manifest.
 */
export enum ErrorManifest {
  ManifestUrlDoesNotExist = 'Manifest url does not exist',
  UnsupportedManifestType = 'Unsupported manifest type',
}

/**
 * Represents error messages related to signature.
 */
export enum ErrorSignature {
  SignatureNotVerified = 'Signature not verified',
  InvalidSignature = 'Invalid signature',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found.',
  AccountCannotBeRegistered = 'Account cannot be registered.',
  BalanceCouldNotBeRetreived = 'User balance could not be retrieved.',
  InvalidCredentials = 'Invalid credentials.',
  AlreadyAssigned = 'User already has an address assigned.',
  NoWalletAddresRegistered = 'No wallet address registered on your account.',
  KycNotApproved = 'KYC not approved.',
  LabelingEnableFailed = 'Failed to enable labeling for this account.',
  InvalidType = 'User has invalid type.',
  DuplicatedAddress = 'The address you are trying to use already exists. Please check that the address is correct or use a different address.',
}

/**
 * Represents error messages related to captcha.
 */
export enum ErrorCapthca {
  InvalidToken = 'Invalid captcha token provided',
  VerificationFailed = 'Captcha verification failed',
}

/**
 * Represents error messages related to send grid.
 */
export enum ErrorSendGrid {
  EmailNotSent = 'Email was not sent',
  InvalidApiKey = 'Invalid SendGrid API key',
}

/**
 * Represents error messages associated with a cron job.
 */
export enum ErrorCronJob {
  NotCreated = 'Cron job has not been created',
  NotCompleted = 'Cron job is not completed',
  Completed = 'Cron job is completed',
}

/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  NoValidNetworks = 'No valid networks found',
  InvalidChainId = 'Invalid chain id provided for the configured environment',
  GasPriceError = 'Error calculating gas price',
}

/**
 * Represents error messages related to operator.
 */
export enum ErrorOperator {
  OperatorAlreadyActive = 'Operator is already active',
  OperatorNotActive = 'Operator not active',
}
