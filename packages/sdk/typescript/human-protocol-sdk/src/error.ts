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
 * @constant {Error} - Invalid escrow address provided.
 */
export const ErrorInvalidEscrowAddressProvided = new Error(
  'Invalid escrow address provided'
);

/**
 * @constant {Error} - Failed to approve staking amount: allowance not updated.
 */
export const ErrorFailedToApproveStakingAmountAllowanceNotUpdated = new Error(
  'Failed to approve staking amount: allowance not updated'
);

/**
 * @constant {Error} - Staking insufficient allowance.
 */
export const ErrorStakingInsufficientAllowance = new Error(
  'Staking insufficient allowance'
);

/**
 * @constant {Error} - Failed to stake.
 */
export const ErrorStakingFailedToStake = new Error('Failed to stake');

/**
 * @constant {Error} - Failed to unstake.
 */
export const ErrorStakingFailedToUnstake = new Error('Failed to unstake');

/**
 * @constant {Error} - Failed to distribute rewards.
 */
export const ErrorStakingFailedToDistributeRewards = new Error(
  'Failed to distribute rewards'
);

/**
 * @constant {Error} - Failed to allocate.
 */
export const ErrorStakingFailedToAllocate = new Error('Failed to allocate');

/**
 * @constant {Error} - Failed to close allocation.
 */
export const ErrorStakingFailedToCloseAllocation = new Error(
  'Failed to close allocation'
);

/**
 * @constant {Error} - Failed to unstake.
 */
export const ErrorStakingFailedToSlash = new Error('Failed to slash');

/**
 * @constant {Error} - Error getting allocation data.
 */
export const ErrorStakingGetAllocation = new Error(
  'Error getting allocation data'
);

/**
 * @constant {Error} - Error getting staker data.
 */
export const ErrorStakingGetStaker = new Error('Error getting staker data');

/**
 * @constant {Error} - Error stakers not found.
 */
export const ErrorStakingStakersNotFound = new Error('Error stakers not found');

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
export const ErrorInitProviderDoesNotExist = new Error(
  'Provider does not exist'
);

/**
 * @constant {Error} - Init with unsupported chain ID.
 */
export const ErrorInitUnsupportedChainID = new Error('Unsupported chain ID');
