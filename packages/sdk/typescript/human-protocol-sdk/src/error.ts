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
 * @constant {Error} - The Storage access data is missing.
 */
export const ErrorStorageAccessDataMissing = new Error(
  'Storage access data is missing'
);
