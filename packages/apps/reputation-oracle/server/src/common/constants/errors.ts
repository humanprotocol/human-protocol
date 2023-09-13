/**
 * Represents error messages related to webhook.
 */
export enum ErrorWebhook {
  NotFound = 'Webhook not found',
  NotCreated = 'Webhook has not been created',
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
}

/**
 * Represents error messages related to manifest.
 */
export enum ErrorManifest {
  ManifestUrlDoesNotExist = 'Manifest url does not exist',
  UnsupportedManifestType = 'Unsupported manifest type'
}

/**
 * Represents error messages related to signature.
 */
export enum ErrorSignature {
  SignatureNotVerified = 'Signature not verified',
  InvalidSignature = 'Invalid signature',
}
