/**
 * Represents error messages related to webhook.
 */
export enum ErrorWebhook {
  NotFound = 'Webhook not found',
  NotCreated = 'Webhook has not been created',
  InvalidEventType = 'Invalid event type',
}

/**
 * Represents error messages related to reputation.
 */
export enum ErrorReputation {
  NotFound = 'Reputation not found',
  NotCreated = 'Reputation has not been created',
}

/**
 * Represents error messages related to results.
 */
export enum ErrorResults {
  IntermediateResultsURLNotSet = 'Intermediate results URL is not set',
  NoIntermediateResultsFound = 'No intermediate results found',
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
  KycNotApproved = 'KYC not approved',
}

/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  NotFound = 'Auth not found',
  InvalidEmailOrPassword = 'Invalid email or password',
  RefreshTokenHasExpired = 'Refresh token has expired',
  UserNotActive = 'User not active',
  InvalidSignature = 'Invalid signature',
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
}
