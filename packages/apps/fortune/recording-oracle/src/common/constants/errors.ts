/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  AddressMismatches = 'Escrow Recording Oracle address mismatches the current one',
  InvalidStatus = 'Escrow is not in the Pending status',
  InvalidManifest = 'Manifest does not contain the required data',
  InvalidJobType = 'Manifest contains an invalid job type',
  NotFoundIntermediateResultsUrl = 'Error while getting intermediate results url from escrow contract',
  SolutionAlreadyExists = 'Solution already exists',
  AllSolutionsHaveAlreadyBeenSent = 'All solutions have already been sent',
  ManifestNotFound = 'Manifest not found',
}

/**
 * Represents error messages related to bucket.
 */
export enum ErrorBucket {
  NotPublic = 'Bucket is not public',
  UnableSaveFile = 'Unable to save file',
}
