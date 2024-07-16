"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumericFault = exports.ReplacementUnderpriced = exports.InvalidArgumentError = exports.EthereumError = exports.ErrorHashIsEmptyString = exports.ErrorLaunchedEventIsNotEmitted = exports.ErrorRecipientAndAmountsMustBeSameLength = exports.ErrorAmountsCannotBeEmptyArray = exports.ErrorEscrowDoesNotHaveEnoughBalance = exports.ErrorAmountMustBeGreaterThanZero = exports.ErrorRecipientCannotBeEmptyArray = exports.ErrorTotalFeeMustBeLessThanHundred = exports.ErrorFeeMustBeBetweenZeroAndHundred = exports.ErrorNoURLprovided = exports.ErrorListOfHandlersCannotBeEmpty = exports.ErrorUrlIsEmptyString = exports.ErrorInvalidUrl = exports.ErrorStorageClientDoesNotExist = exports.ErrorManifestFileDoesNotExist = exports.ErrorTransferEventNotFoundInTransactionLogs = exports.ErrorEscrowAddressIsNotProvidedByFactory = exports.ErrorSigner = exports.ErrorUnsupportedChainID = exports.ErrorProviderDoesNotExist = exports.ErrorHMTokenAmountNotApproved = exports.ErrorFailedToCheckAllowance = exports.ErrorFailedToApproveStakingAmountSignerDoesNotExist = exports.ErrorStakingGetStakers = exports.ErrorInvalidEscrowAddressProvided = exports.ErrorCannotUseDateAndBlockSimultaneously = exports.ErrorInvalidHahsProvided = exports.ErrorInvalidStakerAddressProvided = exports.ErrorInvalidSlasherAddressProvided = exports.ErrorInvalidStakingValueSign = exports.ErrorInvalidStakingValueType = exports.ErrorStakingValueMustBePositive = exports.ErrorInvalidExchangeOracleAddressProvided = exports.ErrorInvalidReputationOracleAddressProvided = exports.ErrorInvalidRecordingOracleAddressProvided = exports.ErrorInvalidTokenAddress = exports.ErrorInvalidAddress = exports.ErrorKVStoreArrayLength = exports.ErrorKVStoreEmptyKey = exports.ErrorStorageFileNotUploaded = exports.ErrorStorageFileNotFound = exports.ErrorStorageBucketNotFound = exports.ErrorStorageCredentialsMissing = exports.ErrorStorageClientNotExists = exports.ErrorStorageClientNotInitialized = exports.ErrorStakingMissing = void 0;
exports.WarnSubgraphApiKeyNotProvided = exports.ErrorUnsupportedStatus = exports.ErrorInvalidHash = exports.InvalidEthereumAddressError = exports.ContractExecutionError = exports.TransactionReplaced = exports.NonceExpired = void 0;
/**
 * @constant {Error} - The Staking contract is missing.
 */
exports.ErrorStakingMissing = new Error('Staking contract is missing');
/**
 * @constant {Error} - The Storage client not initialised.
 */
exports.ErrorStorageClientNotInitialized = new Error('Storage client not initialized');
/**
 * @constant {Error} - The Storage does not exists.
 */
exports.ErrorStorageClientNotExists = new Error('Storage client does not exists');
/**
 * @constant {Error} - The Storage credentials is missing.
 */
exports.ErrorStorageCredentialsMissing = new Error('Storage credentials is missing');
/**
 * @constant {Error} - The Storage bucket not found.
 */
exports.ErrorStorageBucketNotFound = new Error('Bucket not found');
/**
 * @constant {Error} - The Storage file not found.
 */
exports.ErrorStorageFileNotFound = new Error('File not found');
/**
 * @constant {Error} - The Storage file not uploaded.
 */
exports.ErrorStorageFileNotUploaded = new Error('File not uploaded');
/**
 * @constant {Error} - The KVStore key can not be empty.
 */
exports.ErrorKVStoreEmptyKey = new Error('Key can not be empty');
/**
 * @constant {Error} - The KVStore arrays must have the same length.
 */
exports.ErrorKVStoreArrayLength = new Error('Arrays must have the same length');
/**
 * @constant {Error} - The Address sent is invalid.
 */
exports.ErrorInvalidAddress = new Error('Invalid address');
/**
 * @constant {Error} - The token address sent is invalid.
 */
exports.ErrorInvalidTokenAddress = new Error('Invalid token address');
/**
 * @constant {Error} - Invalid recording oracle address provided.
 */
exports.ErrorInvalidRecordingOracleAddressProvided = new Error('Invalid recording oracle address provided');
/**
 * @constant {Error} - Invalid reputation oracle address provided.
 */
exports.ErrorInvalidReputationOracleAddressProvided = new Error('Invalid reputation oracle address provided');
/**
 * @constant {Error} - Invalid reputation oracle address provided.
 */
exports.ErrorInvalidExchangeOracleAddressProvided = new Error('Invalid exchange oracle address provided');
/**
 * @constant {Error} - The Staking value must be positive.
 */
exports.ErrorStakingValueMustBePositive = new Error('Value must be positive');
/**
 * @constant {Error} - Invalid staking value: amount must be a BigNumber.
 */
exports.ErrorInvalidStakingValueType = new Error('Invalid staking value: amount must be a BigNumber');
/**
 * @constant {Error} - Invalid staking value: amount must be positive.
 */
exports.ErrorInvalidStakingValueSign = new Error('Invalid staking value: amount must be positive');
/**
 * @constant {Error} - Invalid slasher address provided.
 */
exports.ErrorInvalidSlasherAddressProvided = new Error('Invalid slasher address provided');
/**
 * @constant {Error} - Invalid staker address provided.
 */
exports.ErrorInvalidStakerAddressProvided = new Error('Invalid staker address provided');
/**
 * @constant {Error} - Invalid hash provided.
 */
exports.ErrorInvalidHahsProvided = new Error('Invalid hash provided');
/**
 * @constant {Error} - Cannot use both date and block filters simultaneously.
 */
exports.ErrorCannotUseDateAndBlockSimultaneously = new Error('Cannot use both date and block filters simultaneously');
/**
 * @constant {Error} - Invalid escrow address provided.
 */
exports.ErrorInvalidEscrowAddressProvided = new Error('Invalid escrow address provided');
/**
 * @constant {Error} - Error getting stakers data.
 */
exports.ErrorStakingGetStakers = new Error('Error getting stakers data');
/**
 * @constant {Error} - Failed to approve staking amount: signerOrProvider is not a Signer instance.
 */
exports.ErrorFailedToApproveStakingAmountSignerDoesNotExist = new Error('Failed to approve staking amount: signerOrProvider is not a Signer instance');
exports.ErrorFailedToCheckAllowance = new Error('Failed to check allowance');
/**
 * @constant {Error} - The HMToken amount not approved.
 */
exports.ErrorHMTokenAmountNotApproved = new Error('Amount not approved');
/**
 * @constant {Error} - Init provider does not exists.
 */
exports.ErrorProviderDoesNotExist = new Error('Provider does not exist');
/**
 * @constant {Error} - Init with unsupported chain ID.
 */
exports.ErrorUnsupportedChainID = new Error('Unsupported chain ID');
/**
 * @constant {Error} - Sending a transaction requires a signer.
 */
exports.ErrorSigner = new Error('Signer required');
/**
 * @constant {Error} - Escrow address is not provided by the factory.
 */
exports.ErrorEscrowAddressIsNotProvidedByFactory = new Error('Escrow address is not provided by the factory');
/**
 * @constant {Error} - Transfer event not found in transaction logs.
 */
exports.ErrorTransferEventNotFoundInTransactionLogs = new Error('Transfer event not found in transaction logs');
/**
 * @constant {Error} - Manifest file does not exist.
 */
exports.ErrorManifestFileDoesNotExist = new Error('Manifest file does not exist');
/**
 * @constant {Error} - Storage client does not exist.
 */
exports.ErrorStorageClientDoesNotExist = new Error('Storage client does not exist');
/**
 * @constant {Error} - Invalid URL string.
 */
exports.ErrorInvalidUrl = new Error('Invalid URL string');
/**
 * @constant {Error} - URL is an empty string.
 */
exports.ErrorUrlIsEmptyString = new Error('URL is an empty string');
/**
 * @constant {Error} - List of handlers cannot be empty.
 */
exports.ErrorListOfHandlersCannotBeEmpty = new Error('List of handlers cannot be empty');
/**
 * @constant {Error} - No URL provided.
 */
exports.ErrorNoURLprovided = new Error('No URL provided');
/**
 * @constant {Error} - Fee must be between 0 and 100.
 */
exports.ErrorFeeMustBeBetweenZeroAndHundred = new Error('Fee must be between 0 and 100');
/**
 * @constant {Error} - Total fee must be less than 100.
 */
exports.ErrorTotalFeeMustBeLessThanHundred = new Error('Total fee must be less than 100');
/**
 * @constant {Error} - Recipient cannot be an empty array.
 */
exports.ErrorRecipientCannotBeEmptyArray = new Error('Recipient cannot be an empty array');
/**
 * @constant {Error} - Amount must be greater than zero..
 */
exports.ErrorAmountMustBeGreaterThanZero = new Error('Amount must be greater than zero');
/**
 * @constant {Error} - Escrow does not have enough balance.
 */
exports.ErrorEscrowDoesNotHaveEnoughBalance = new Error('Escrow does not have enough balance');
/**
 * @constant {Error} - Amounts cannot be an empty array.
 */
exports.ErrorAmountsCannotBeEmptyArray = new Error('Amounts cannot be an empty array');
/**
 * @constant {Error} - Recipient and amounts must be the same length.
 */
exports.ErrorRecipientAndAmountsMustBeSameLength = new Error('Recipient and amounts must be the same length');
/**
 * @constant {Error} - Launched event is not emitted.
 */
exports.ErrorLaunchedEventIsNotEmitted = new Error('Launched event is not emitted');
/**
 * @constant {Error} - Hash is an empty string.
 */
exports.ErrorHashIsEmptyString = new Error('Hash is an empty string');
var EthereumError = /** @class */ (function (_super) {
    __extends(EthereumError, _super);
    function EthereumError(message) {
        return _super.call(this, "An error occurred while interacting with Ethereum: ".concat(message)) || this;
    }
    return EthereumError;
}(Error));
exports.EthereumError = EthereumError;
var InvalidArgumentError = /** @class */ (function (_super) {
    __extends(InvalidArgumentError, _super);
    function InvalidArgumentError(message) {
        return _super.call(this, "Invalid argument: ".concat(message)) || this;
    }
    return InvalidArgumentError;
}(EthereumError));
exports.InvalidArgumentError = InvalidArgumentError;
var ReplacementUnderpriced = /** @class */ (function (_super) {
    __extends(ReplacementUnderpriced, _super);
    function ReplacementUnderpriced(message) {
        return _super.call(this, "Replacement underpriced: ".concat(message)) || this;
    }
    return ReplacementUnderpriced;
}(EthereumError));
exports.ReplacementUnderpriced = ReplacementUnderpriced;
var NumericFault = /** @class */ (function (_super) {
    __extends(NumericFault, _super);
    function NumericFault(message) {
        return _super.call(this, "Numeric fault: ".concat(message)) || this;
    }
    return NumericFault;
}(EthereumError));
exports.NumericFault = NumericFault;
var NonceExpired = /** @class */ (function (_super) {
    __extends(NonceExpired, _super);
    function NonceExpired(message) {
        return _super.call(this, "Nonce expired: ".concat(message)) || this;
    }
    return NonceExpired;
}(EthereumError));
exports.NonceExpired = NonceExpired;
var TransactionReplaced = /** @class */ (function (_super) {
    __extends(TransactionReplaced, _super);
    function TransactionReplaced(message) {
        return _super.call(this, "Transaction replaced: ".concat(message)) || this;
    }
    return TransactionReplaced;
}(EthereumError));
exports.TransactionReplaced = TransactionReplaced;
var ContractExecutionError = /** @class */ (function (_super) {
    __extends(ContractExecutionError, _super);
    function ContractExecutionError(reason) {
        return _super.call(this, "Contract execution error: ".concat(reason)) || this;
    }
    return ContractExecutionError;
}(EthereumError));
exports.ContractExecutionError = ContractExecutionError;
var InvalidEthereumAddressError = /** @class */ (function (_super) {
    __extends(InvalidEthereumAddressError, _super);
    function InvalidEthereumAddressError(address) {
        return _super.call(this, "Invalid ethereum address error: ".concat(address)) || this;
    }
    return InvalidEthereumAddressError;
}(Error));
exports.InvalidEthereumAddressError = InvalidEthereumAddressError;
/**
 * @constant {Error} - The Hash does not match
 */
exports.ErrorInvalidHash = new Error('Invalid hash');
/**
 * @constant {Error} - The Status is not supported
 */
exports.ErrorUnsupportedStatus = new Error('Unsupported status for query');
/**
 * @constant {Error} - The SUBGRAPH_API_KEY is not being provided
 */
exports.WarnSubgraphApiKeyNotProvided = '"SUBGRAPH_API_KEY" is not being provided. It might cause issues with the subgraph.';
