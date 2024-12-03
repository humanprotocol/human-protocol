/**
 * Represents common error messages.
 */
export enum ErrorCommon {
  ErrorProcessingDataset = 'Error processing dataset',
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
