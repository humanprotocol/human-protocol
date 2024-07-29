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
 * @constant {Error} - Invalid reputation oracle address provided.
 */
export const ErrorInvalidExchangeOracleAddressProvided = new Error(
  'Invalid exchange oracle address provided'
);

/**
 * @constant {Error} - The Staking value must be positive.
 */
export const ErrorStakingValueMustBePositive = new Error(
  'Value must be positive'
);

/**
 * @constant {Error} - Invalid staking value: amount must be a BigNumber.
 */
export const ErrorInvalidStakingValueType = new Error(
  'Invalid staking value: amount must be a BigNumber'
);

/**
 * @constant {Error} - Invalid staking value: amount must be positive.
 */
export const ErrorInvalidStakingValueSign = new Error(
  'Invalid staking value: amount must be positive'
);

/**
 * @constant {Error} - Invalid slasher address provided.
 */
export const ErrorInvalidSlasherAddressProvided = new Error(
  'Invalid slasher address provided'
);

/**
 * @constant {Error} - Invalid staker address provided.
 */
export const ErrorInvalidStakerAddressProvided = new Error(
  'Invalid staker address provided'
);

/**
 * @constant {Error} - Invalid hash provided.
 */
export const ErrorInvalidHahsProvided = new Error('Invalid hash provided');

/**
 * @constant {Error} - Cannot use both date and block filters simultaneously.
 */
export const ErrorCannotUseDateAndBlockSimultaneously = new Error(
  'Cannot use both date and block filters simultaneously'
);

/**
 * @constant {Error} - Invalid escrow address provided.
 */
export const ErrorInvalidEscrowAddressProvided = new Error(
  'Invalid escrow address provided'
);

/**
 * @constant {Error} - Error getting stakers data.
 */
export const ErrorStakingGetStakers = new Error('Error getting stakers data');

/**
 * @constant {Error} - Failed to approve staking amount: signerOrProvider is not a Signer instance.
 */
export const ErrorFailedToApproveStakingAmountSignerDoesNotExist = new Error(
  'Failed to approve staking amount: signerOrProvider is not a Signer instance'
);

export const ErrorFailedToCheckAllowance = new Error(
  'Failed to check allowance'
);

/**
 * @constant {Error} - The HMToken amount not approved.
 */
export const ErrorHMTokenAmountNotApproved = new Error('Amount not approved');

/**
 * @constant {Error} - Init provider does not exists.
 */
export const ErrorProviderDoesNotExist = new Error('Provider does not exist');

/**
 * @constant {Error} - Init with unsupported chain ID.
 */
export const ErrorUnsupportedChainID = new Error('Unsupported chain ID');

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
 * @constant {Error} - Transfer event not found in transaction logs.
 */
export const ErrorTransferEventNotFoundInTransactionLogs = new Error(
  'Transfer event not found in transaction logs'
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
 * @constant {Error} - Launched event is not emitted.
 */
export const ErrorLaunchedEventIsNotEmitted = new Error(
  'Launched event is not emitted'
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

export class InvalidEthereumAddressError extends Error {
  constructor(address: string) {
    super(`Invalid ethereum address error: ${address}`);
  }
}
/**
 * @constant {Error} - The Hash does not match
 */
export const ErrorInvalidHash = new Error('Invalid hash');

/**
 * @constant {Error} - The Status is not supported
 */
export const ErrorUnsupportedStatus = new Error('Unsupported status for query');

/**
 * @constant {Error} - The SUBGRAPH_API_KEY is not being provided
 */
export const WarnSubgraphApiKeyNotProvided =
  '"SUBGRAPH_API_KEY" is not being provided. It might cause issues with the subgraph.';
