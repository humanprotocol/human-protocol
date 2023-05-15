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
 * @constant {Error} - The KVStore arrays must have the same length.
 */
export const ErrorKVStoreArrayLength = new Error(
  'Arrays must have the same length'
);

/**
 * @constant {Error} - The Address sent is invalid.
 */
export const ErrorInvalidAddress = new Error('Invalid address');

/**
 * @constant {Error} - The token address sent is invalid.
 */
export const ErrorInvalidTokenAddress = new Error('Invalid token address');

/**
 * @constant {Error} - Invalid escrow address provided.
 */
export const ErrorInvalidEscrowAddressProvided = new Error(
  'Invalid escrow address provided'
);

/**
 * @constant {Error} - Invalid recording oracle address provided.
 */
export const ErrorInvalidRecordingOracleAddressProvided = new Error(
  'Invalid recording oracle address provided'
);

/**
 * @constant {Error} - Invalid reputation oracle address provided.
 */
export const ErrorInvalidReputationOracleAddressProvided = new Error(
  'Invalid reputation oracle address provided'
);

/**
 * @constant {Error} - Init provider does not exists.
 */
export const ErrorInitProviderDoesNotExist = new Error(
  'Provider does not exist'
);

/**
 * @constant {Error} - Init with unsupported chain ID.
 */
export const ErrorInitUnsupportedChainID = new Error('Unsupported chain ID');

/**
 * @constant {Error} - Sending a transaction requires a signer.
 */
export const ErrorSigner = new Error('Signer required');

/**
 * @constant {Error} - Escrow address is not provided by the factory.
 */
export const ErrorEscrowAddressIsNotProvidedByFactory = new Error(
  'Escrow address is not provided by the factory'
);

/**
 * @constant {Error} - Manifest file does not exist.
 */
export const ErrorManifestFileDoesNotExist = new Error(
  'Manifest file does not exist'
);

/**
 * @constant {Error} - Storage client does not exist.
 */
export const ErrorStorageClientDoesNotExist = new Error(
  'Storage client does not exist'
);

/**
 * @constant {Error} - Invalid URL string.
 */
export const ErrorInvalidUrl = new Error('Invalid URL string');

/**
 * @constant {Error} - URL is an empty string.
 */
export const ErrorUrlIsEmptyString = new Error('URL is an empty string');

/**
 * @constant {Error} - List of handlers cannot be empty.
 */
export const ErrorListOfHandlersCannotBeEmpty = new Error(
  'List of handlers cannot be empty'
);

/**
 * @constant {Error} - No URL provided.
 */
export const ErrorNoURLprovided = new Error('No URL provided');

/**
 * @constant {Error} - Fee must be between 0 and 100.
 */
export const ErrorFeeMustBeBetweenZeroAndHundred = new Error(
  'Fee must be between 0 and 100'
);

/**
 * @constant {Error} - Total fee must be less than 100.
 */
export const ErrorTotalFeeMustBeLessThanHundred = new Error(
  'Total fee must be less than 100'
);

/**
 * @constant {Error} - Recipient cannot be an empty array.
 */
export const ErrorRecipientCannotBeEmptyArray = new Error(
  'Recipient cannot be an empty array'
);

/**
 * @constant {Error} - Amount must be greater than zero..
 */
export const ErrorAmountMustBeGreaterThanZero = new Error(
  'Amount must be greater than zero'
);

/**
 * @constant {Error} - Escrow does not have enough balance.
 */
export const ErrorEscrowDoesNotHaveEnoughBalance = new Error(
  'Escrow does not have enough balance'
);

/**
 * @constant {Error} - Amounts cannot be an empty array.
 */
export const ErrorAmountsCannotBeEmptyArray = new Error(
  'Amounts cannot be an empty array'
);

/**
 * @constant {Error} - Recipient and amounts must be the same length.
 */
export const ErrorRecipientAndAmountsMustBeSameLength = new Error(
  'Recipient and amounts must be the same length'
);

/**
 * @constant {Error} - Hash is an empty string.
 */
export const ErrorHashIsEmptyString = new Error('Hash is an empty string');

export class EthereumError extends Error {
  constructor(message: string) {
    super(`An error occurred while interacting with Ethereum: ${message}`);
  }
}

export class InvalidArgumentError extends EthereumError {
  constructor(message: string) {
    super(`Invalid argument: ${message}`);
  }
}

export class OutOfGasError extends EthereumError {
  constructor(message: string) {
    super(`Out of gas: ${message}`);
  }
}

export class UnpredictableGasLimit extends EthereumError {
  constructor(message: string) {
    super(`Unpredictable gas limit: ${message}`);
  }
}

export class ReplacementUnderpriced extends EthereumError {
  constructor(message: string) {
    super(`Replacement underpriced: ${message}`);
  }
}

export class NumericFault extends EthereumError {
  constructor(message: string) {
    super(`Numeric fault: ${message}`);
  }
}

export class NonceExpired extends EthereumError {
  constructor(message: string) {
    super(`Nonce expired: ${message}`);
  }
}

export class TransactionReplaced extends EthereumError {
  constructor(message: string) {
    super(`Transaction replaced: ${message}`);
  }
}

export class ContractExecutionError extends EthereumError {
  constructor(reason: string) {
    super(`Contract execution error: ${reason}`);
  }
}
