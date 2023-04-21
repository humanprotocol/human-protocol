/**
 * @constant {Error} - The job is not initialized yet.
 */
export const ErrorJobNotInitialized = new Error('Job is not initialized');

/**
 * @constant {Error} - The job is not launched yet.
 */
export const ErrorJobNotLaunched = new Error('Job is not launched');

/**
 * @constant {Error} - The job is already launched.
 */
export const ErrorJobAlreadyLaunched = new Error('Job is already launched');

/**
 * @constant {Error} - The reputation oracle is missing.
 */
export const ErrorReputationOracleMissing = new Error(
  'Reputation oracle is missing'
);

/**
 * @constant {Error} - The manifest is missing.
 */
export const ErrorManifestMissing = new Error('Manifest is missing');

/**
 * @constant {Error} - The HMToken is missing.
 */
export const ErrorHMTokenMissing = new Error('HMToken is missing');

/**
 * @constant {Error} - The Staking contract is missing.
 */
export const ErrorStakingMissing = new Error('Staking contract is missing');

/**
 * @constant {Error} - The Storage client not initialised.
 */
export const ErrorStorageClientNotInitialized = new Error(
  'Storage client not initialized'
);

/**
 * @constant {Error} - The Storage does not exists.
 */
export const ErrorStorageClientNotExists = new Error(
  'Storage client does not exists'
);

/**
 * @constant {Error} - The Storage credentials is missing.
 */
export const ErrorStorageCredentialsMissing = new Error(
  'Storage credentials is missing'
);

/**
 * @constant {Error} - The Storage bucket not found.
 */
export const ErrorStorageBucketNotFound = new Error('Bucket not found');

/**
 * @constant {Error} - The Storage file not found.
 */
export const ErrorStorageFileNotFound = new Error('File not found');

/**
 * @constant {Error} - The Storage file not uploaded.
 */
export const ErrorStorageFileNotUploaded = new Error('File not uploaded');

/**
 * @constant {Error} - The KVStore key can not be empty.
 */
export const ErrorKVStoreEmptyKey = new Error('Key can not be empty');

/**
 * @constant {Error} - The KVStore key can not be empty.
 */
export const ErrorKVStoreEmptyValue = new Error('Value can not be empty');

/**
 * @constant {Error} - The KVStore arrays must have the same length.
 */
export const ErrorKVStoreArrayLength = new Error(
  'Arrays must have the same length'
);

/**
 * @constant {Error} - The KVStore key can not be empty.
 */
export const ErrorKVStoreValueNotFound = new Error('Value not found');

/**
 * @constant {Error} - The Address sent is invalid.
 */
export const ErrorInvalidAddress = new Error('Invalid address');

/**
 * @constant {Error} - ChainId not supported.
 */
export const ErrorChainId = new Error('ChainId not supported');
