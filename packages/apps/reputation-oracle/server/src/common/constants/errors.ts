/**
 * Represents error messages related to webhook.
 */
export enum ErrorWebhook {
  NotFound = 'Webhook not found',
  UrlNotFound = 'Webhook url not found',
  NotCreated = 'Webhook has not been created',
  InvalidEventType = 'Invalid event type',
  NotSent = 'Webhook was not sent',
}

/**
 * Represents error messages related to reputation.
 */
export enum ErrorReputation {
  NotFound = 'Reputation not found',
  NotCreated = 'Reputation has not been created',
}

/**
 * Represents error messages related to credential.
 */
export enum ErrorCredential {
  NotFound = 'Credential not found',
  NotCreated = 'Credential has not been created',
  InvalidCredential = 'Invalid credential',
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
  NotFound = 'User not found',
  AccountCannotBeRegistered = 'Account cannot be registered',
  BalanceCouldNotBeRetreived = 'User balance could not be retrieved',
  InvalidCredentials = 'Invalid credentials',
  IncorrectAddress = 'Incorrect address',
  NoWalletAddresRegistered = 'No wallet address registered on your account',
  KycNotApproved = 'KYC not approved',
  UserNotActive = 'User not active',
  LabelingEnableFailed = 'Failed to enable labeling for this account',
  InvalidType = 'User has invalid type',
  DuplicatedEmail = 'The email you are trying to use already exists. Please check that the email is correct or use a different email',
  DuplicatedAddress = 'The address you are trying to use already exists. Please check that the address is correct or use a different address',
}

/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  NotFound = 'Auth not found',
  InvalidEmailOrPassword = 'Invalid email or password',
  RefreshTokenHasExpired = 'Refresh token has expired',
  TokenExpired = 'Token has expired',
  UserNotActive = 'User not active',
  InvalidSignature = 'Invalid signature',
  InvalidRole = 'Invalid role in KVStore',
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
 * Represents error messages related to send grid.
 */
export enum ErrorSendGrid {
  EmailNotSent = 'Email was not sent',
  InvalidApiKey = 'Invalid SendGrid API key',
}

export enum ErrorKyc {
  NotFound = 'KYC session not found',
  AlreadyApproved = 'KYC session already approved',
  VerificationInProgress = 'KYC session verification in progress',
  Rejected = 'KYC session rejected',
  InvalidSynapsAPIResponse = 'Invalid Synaps API response',
  InvalidWebhookSecret = 'Invalid webhook secret',
  CountryNotSet = 'Сountry is not set for the user',
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
  OperatorNotActive = 'Operator not active',
}
