/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ERC20,
  ERC20__factory,
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, EventLog, Overrides, Signer, ethers } from 'ethers';
import { BaseEthersClient } from '../base';
import { ESCROW_BULK_PAYOUT_MAX_ITEMS, NETWORKS } from '../constants';
import { requiresSigner } from '../decorators';
import { ChainId } from '../enums';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorBulkPayOutVersion,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidExchangeOracleAddressProvided,
  ErrorInvalidManifest,
  ErrorInvalidRecordingOracleAddressProvided,
  ErrorInvalidReputationOracleAddressProvided,
  ErrorInvalidTokenAddress,
  ErrorInvalidUrl,
  ErrorLaunchedEventIsNotEmitted,
  ErrorProviderDoesNotExist,
  ErrorRecipientAndAmountsMustBeSameLength,
  ErrorRecipientCannotBeEmptyArray,
  ErrorStoreResultsVersion,
  ErrorTooManyRecipients,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorTransferEventNotFoundInTransactionLogs,
  ErrorUnsupportedChainID,
  InvalidEthereumAddressError,
  WarnVersionMismatch,
} from '../error';
import { IEscrowConfig, IEscrowWithdraw } from '../interfaces';
import {
  EscrowStatus,
  NetworkData,
  TransactionLikeWithNonce,
  TransactionOverrides,
} from '../types';
import { isValidJson, isValidUrl, throwError } from '../utils';

/**
 * Client to perform actions on Escrow contracts and obtain information from the contracts.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static [`build`](/ts/classes/EscrowClient/#build) method.
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model to send transactions calling the contract functions.
 * - **Provider**: when the user wants to use this model to get information from the contracts or subgraph.
 *
 * @example
 *
 * ###Using Signer
 *
 * ####Using private key (backend)
 *
 * ```ts
 * import { EscrowClient } from '@human-protocol/sdk';
 * import { Wallet, JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY';
 *
 * const provider = new JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const escrowClient = await EscrowClient.build(signer);
 * ```
 *
 * ####Using Wagmi (frontend)
 *
 * ```ts
 * import { useSigner } from 'wagmi';
 * import { EscrowClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const escrowClient = await EscrowClient.build(signer);
 * ```
 *
 * ###Using Provider
 *
 * ```ts
 * import { EscrowClient } from '@human-protocol/sdk';
 * import { JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const provider = new JsonRpcProvider(rpcUrl);
 * const escrowClient = await EscrowClient.build(provider);
 * ```
 */
export class EscrowClient extends BaseEthersClient {
  public escrowFactoryContract: EscrowFactory;

  /**
   * **EscrowClient constructor**
   *
   * @param runner - The Runner object to interact with the Ethereum network
   * @param networkData - The network information required to connect to the Escrow contract
   * @returns An instance of EscrowClient
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    super(runner, networkData);

    this.escrowFactoryContract = EscrowFactory__factory.connect(
      networkData.factoryAddress,
      runner
    );
  }

  /**
   * Creates an instance of EscrowClient from a Runner.
   *
   * @param runner - The Runner object to interact with the Ethereum network
   * @returns An instance of EscrowClient
   * @throws ErrorProviderDoesNotExist If the provider does not exist for the provided Signer
   * @throws ErrorUnsupportedChainID If the network's chainId is not supported
   */
  public static async build(runner: ContractRunner): Promise<EscrowClient> {
    if (!runner.provider) {
      throw ErrorProviderDoesNotExist;
    }

    const network = await runner.provider?.getNetwork();

    const chainId: ChainId = Number(network?.chainId);
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new EscrowClient(runner, networkData);
  }

  /**
   * Connects to the escrow contract
   *
   * @param escrowAddress Escrow address to connect to
   */
  private getEscrowContract(escrowAddress: string): Escrow {
    try {
      return Escrow__factory.connect(escrowAddress, this.runner);
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function creates an escrow contract that uses the token passed to pay oracle fees and reward workers.
   * @remarks Need to have available stake.
   * @param tokenAddress - The address of the token to use for escrow funding.
   * @param jobRequesterId - Identifier for the job requester.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns the address of the escrow created.
   * @throws ErrorInvalidTokenAddress If the token address is invalid
   * @throws ErrorLaunchedEventIsNotEmitted If the LaunchedV2 event is not emitted
   *
   * @example
   *
   * ```ts
   * const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
   * const jobRequesterId = "job-requester-id";
   * const escrowAddress = await escrowClient.createEscrow(tokenAddress, jobRequesterId);
   * ```
   */
  @requiresSigner
  public async createEscrow(
    tokenAddress: string,
    jobRequesterId: string,
    txOptions: TransactionOverrides = {}
  ): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    try {
      const result = await this.sendTxAndWait(
        (overrides) =>
          this.escrowFactoryContract.createEscrow(
            tokenAddress,
            jobRequesterId,
            overrides
          ),
        txOptions
      );

      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      if (!event) {
        throw ErrorLaunchedEventIsNotEmitted;
      }

      return event.escrow;
    } catch (e: any) {
      return throwError(e);
    }
  }

  private verifySetupParameters(escrowConfig: IEscrowConfig) {
    const {
      recordingOracle,
      reputationOracle,
      exchangeOracle,
      recordingOracleFee,
      reputationOracleFee,
      exchangeOracleFee,
      manifest,
      manifestHash,
    } = escrowConfig;

    if (!ethers.isAddress(recordingOracle)) {
      throw ErrorInvalidRecordingOracleAddressProvided;
    }

    if (!ethers.isAddress(reputationOracle)) {
      throw ErrorInvalidReputationOracleAddressProvided;
    }

    if (!ethers.isAddress(exchangeOracle)) {
      throw ErrorInvalidExchangeOracleAddressProvided;
    }

    if (
      recordingOracleFee <= 0 ||
      reputationOracleFee <= 0 ||
      exchangeOracleFee <= 0
    ) {
      throw ErrorAmountMustBeGreaterThanZero;
    }

    if (recordingOracleFee + reputationOracleFee + exchangeOracleFee > 100) {
      throw ErrorTotalFeeMustBeLessThanHundred;
    }

    const isManifestValid = isValidUrl(manifest) || isValidJson(manifest);
    if (!isManifestValid) {
      throw ErrorInvalidManifest;
    }

    if (!manifestHash) {
      throw ErrorHashIsEmptyString;
    }
  }

  /**
   * Creates, funds, and sets up a new escrow contract in a single transaction.
   *
   * @remarks Need to have available stake and approve allowance in the token contract before calling this method.
   * @param tokenAddress - The ERC-20 token address used to fund the escrow.
   * @param amount - The token amount to fund the escrow with.
   * @param jobRequesterId - An off-chain identifier for the job requester.
   * @param escrowConfig - Configuration parameters for escrow setup.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns the address of the escrow created.
   * @throws ErrorInvalidTokenAddress If the token address is invalid
   * @throws ErrorInvalidRecordingOracleAddressProvided If the recording oracle address is invalid
   * @throws ErrorInvalidReputationOracleAddressProvided If the reputation oracle address is invalid
   * @throws ErrorInvalidExchangeOracleAddressProvided If the exchange oracle address is invalid
   * @throws ErrorAmountMustBeGreaterThanZero If any oracle fee is less than or equal to zero
   * @throws ErrorTotalFeeMustBeLessThanHundred If the total oracle fees exceed 100
   * @throws ErrorInvalidManifest If the manifest is not a valid URL or JSON string
   * @throws ErrorHashIsEmptyString If the manifest hash is empty
   * @throws ErrorLaunchedEventIsNotEmitted If the LaunchedV2 event is not emitted
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   * import { ERC20__factory } from '@human-protocol/sdk';
   *
   * const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
   * const amount = ethers.parseUnits('1000', 18);
   * const jobRequesterId = 'requester-123';
   *
   * const token = ERC20__factory.connect(tokenAddress, signer);
   * await token.approve(escrowClient.escrowFactoryContract.target, amount);
   *
   * const escrowConfig = {
   *   recordingOracle: '0xRecordingOracleAddress',
   *   reputationOracle: '0xReputationOracleAddress',
   *   exchangeOracle: '0xExchangeOracleAddress',
   *   recordingOracleFee: 5n,
   *   reputationOracleFee: 5n,
   *   exchangeOracleFee: 5n,
   *   manifest: 'https://example.com/manifest.json',
   *   manifestHash: 'manifestHash-123',
   * };
   *
   * const escrowAddress = await escrowClient.createFundAndSetupEscrow(
   *   tokenAddress,
   *   amount,
   *   jobRequesterId,
   *   escrowConfig
   * );
   * console.log('Escrow created at:', escrowAddress);
   * ```
   */
  @requiresSigner
  public async createFundAndSetupEscrow(
    tokenAddress: string,
    amount: bigint,
    jobRequesterId: string,
    escrowConfig: IEscrowConfig,
    txOptions: TransactionOverrides = {}
  ): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    this.verifySetupParameters(escrowConfig);

    const {
      recordingOracle,
      reputationOracle,
      exchangeOracle,
      recordingOracleFee,
      reputationOracleFee,
      exchangeOracleFee,
      manifest,
      manifestHash,
    } = escrowConfig;

    try {
      const result = await this.sendTxAndWait(
        (overrides) =>
          this.escrowFactoryContract.createFundAndSetupEscrow(
            tokenAddress,
            amount,
            jobRequesterId,
            reputationOracle,
            recordingOracle,
            exchangeOracle,
            reputationOracleFee,
            recordingOracleFee,
            exchangeOracleFee,
            manifest,
            manifestHash,
            overrides
          ),
        txOptions
      );

      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      if (!event) {
        throw ErrorLaunchedEventIsNotEmitted;
      }

      return event.escrow;
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function sets up the parameters of the escrow.
   *
   * @remarks Only Job Launcher or admin can call it.
   *
   * @param escrowAddress - Address of the escrow to set up.
   * @param escrowConfig - Escrow configuration parameters.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidRecordingOracleAddressProvided If the recording oracle address is invalid
   * @throws ErrorInvalidReputationOracleAddressProvided If the reputation oracle address is invalid
   * @throws ErrorInvalidExchangeOracleAddressProvided If the exchange oracle address is invalid
   * @throws ErrorAmountMustBeGreaterThanZero If any oracle fee is less than or equal to zero
   * @throws ErrorTotalFeeMustBeLessThanHundred If the total oracle fees exceed 100
   * @throws ErrorInvalidManifest If the manifest is not a valid URL or JSON string
   * @throws ErrorHashIsEmptyString If the manifest hash is empty
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   *
   * ```ts
   * const escrowAddress = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
   * const escrowConfig = {
   *    recordingOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    reputationOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    exchangeOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    recordingOracleFee: 10n,
   *    reputationOracleFee: 10n,
   *    exchangeOracleFee: 10n,
   *    manifest: 'http://localhost/manifest.json',
   *    manifestHash: 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079',
   * };
   * await escrowClient.setup(escrowAddress, escrowConfig);
   * ```
   */
  @requiresSigner
  async setup(
    escrowAddress: string,
    escrowConfig: IEscrowConfig,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    const {
      recordingOracle,
      reputationOracle,
      exchangeOracle,
      recordingOracleFee,
      reputationOracleFee,
      exchangeOracleFee,
      manifest,
      manifestHash,
    } = escrowConfig;

    this.verifySetupParameters(escrowConfig);

    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await this.sendTxAndWait(
        (overrides) =>
          escrowContract.setup(
            reputationOracle,
            recordingOracle,
            exchangeOracle,
            reputationOracleFee,
            recordingOracleFee,
            exchangeOracleFee,
            manifest,
            manifestHash,
            overrides
          ),
        txOptions
      );

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function adds funds of the chosen token to the escrow.
   *
   * @param escrowAddress - Address of the escrow to fund.
   * @param amount - Amount to be added as funds.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorAmountMustBeGreaterThanZero If the amount is less than or equal to zero
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const amount = ethers.parseUnits('5', 'ether');
   * await escrowClient.fund('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
  async fund(
    escrowAddress: string,
    amount: bigint,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (amount <= 0n) {
      throw ErrorAmountMustBeGreaterThanZero;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      const tokenAddress = await escrowContract.token();

      const tokenContract: HMToken = HMToken__factory.connect(
        tokenAddress,
        this.runner
      );
      await this.sendTxAndWait(
        (overrides) => tokenContract.transfer(escrowAddress, amount, overrides),
        txOptions
      );

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Stores the result URL and result hash for an escrow.
   *
   * @remarks Only Recording Oracle or admin can call it.
   *
   * @param escrowAddress - The escrow address.
   * @param url - The URL containing the final results. May be empty only when `fundsToReserve` is `0n`.
   * @param hash - The hash of the results payload.
   * @param txOptions - Optional transaction overrides.
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the provided escrow address is invalid.
   * @throws ErrorInvalidUrl If the URL format is invalid.
   * @throws ErrorHashIsEmptyString If the hash is empty and empty values are not allowed.
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow does not exist in the factory.
   * @throws ErrorStoreResultsVersion If the contract supports only the deprecated signature.
   *
   * @example
   * ```ts
   * await escrowClient.storeResults(
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   'https://example.com/results.json',
   *   '0xHASH123'
   * );
   * ```
   */
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    txOptions?: TransactionOverrides
  ): Promise<void>;

  /**
   * Stores the result URL and result hash for an escrow.
   *
   * @remarks Only Recording Oracle or admin can call it.
   *
   * If `fundsToReserve` is provided, the escrow reserves the specified funds.
   * When `fundsToReserve` is `0n`, an empty URL is allowed (for cases where no solutions were provided).
   *
   * @param escrowAddress - The escrow address.
   * @param url - The URL containing the final results. May be empty only when `fundsToReserve` is `0n`.
   * @param hash - The hash of the results payload.
   * @param fundsToReserve - Optional amount of funds to reserve (when using second overload).
   * @param txOptions - Optional transaction overrides.
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the provided escrow address is invalid.
   * @throws ErrorInvalidUrl If the URL format is invalid.
   * @throws ErrorHashIsEmptyString If the hash is empty and empty values are not allowed.
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow does not exist in the factory.
   * @throws ErrorStoreResultsVersion If the contract supports only the deprecated signature.
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * await escrowClient.storeResults(
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   'https://example.com/results.json',
   *   '0xHASH123',
   *   ethers.parseEther('5')
   * );
   * ```
   */
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    fundsToReserve: bigint,
    txOptions?: TransactionOverrides
  ): Promise<void>;

  @requiresSigner
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    a?: bigint | TransactionOverrides,
    b?: TransactionOverrides
  ): Promise<void> {
    const escrowContract = this.getEscrowContract(escrowAddress);

    const hasFundsToReserveParam = typeof a === 'bigint';
    const fundsToReserve = hasFundsToReserveParam ? (a as bigint) : null;
    const txOptions = (hasFundsToReserveParam ? b : a) as
      | TransactionOverrides
      | undefined;
    // When fundsToReserve is provided and is 0, allow empty URL.
    // In this situation not solutions might have been provided so the escrow can be straight cancelled.
    const allowEmptyUrl = hasFundsToReserveParam && fundsToReserve === 0n;

    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }
    if (!allowEmptyUrl && !isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    if (!hash && !allowEmptyUrl) {
      throw ErrorHashIsEmptyString;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const txFactory = (overrides: Overrides) =>
        fundsToReserve !== null
          ? escrowContract['storeResults(string,string,uint256)'](
              url,
              hash,
              fundsToReserve,
              overrides
            )
          : escrowContract['storeResults(string,string)'](url, hash, overrides);

      await this.sendTxAndWait(txFactory, txOptions);
    } catch (e) {
      if (!hasFundsToReserveParam && e.reason === 'DEPRECATED_SIGNATURE') {
        throw ErrorStoreResultsVersion;
      }
      // eslint-disable-next-line no-console
      console.warn(WarnVersionMismatch);
      return throwError(e);
    }
  }

  /**
   * This function sets the status of an escrow to completed.
   * @remarks Only Recording Oracle or admin can call it.
   * @param escrowAddress - Address of the escrow.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid.
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory.
   *
   * @example
   * ```ts
   * await escrowClient.complete('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async complete(
    escrowAddress: string,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      await this.sendTxAndWait(
        (overrides) => escrowContract.complete(overrides),
        txOptions
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function pays out the amounts specified to the workers and sets the URL of the final results file.
   * @remarks Only Reputation Oracle or admin can call it.
   *
   * @param escrowAddress - Escrow address to payout.
   * @param recipients - Array of recipient addresses.
   * @param amounts - Array of amounts the recipients will receive.
   * @param finalResultsUrl - Final results file URL.
   * @param finalResultsHash - Final results file hash.
   * @param txId - Transaction ID.
   * @param forceComplete - Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorRecipientCannotBeEmptyArray If the recipients array is empty
   * @throws ErrorTooManyRecipients If there are too many recipients
   * @throws ErrorAmountsCannotBeEmptyArray If the amounts array is empty
   * @throws ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths
   * @throws InvalidEthereumAddressError If any recipient address is invalid
   * @throws ErrorInvalidUrl If the final results URL is invalid
   * @throws ErrorHashIsEmptyString If the final results hash is empty
   * @throws ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   * @throws ErrorBulkPayOutVersion If using deprecated signature
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
   * const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const txId = 1;
   *
   * await escrowClient.bulkPayOut(
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   recipients,
   *   amounts,
   *   resultsUrl,
   *   resultsHash,
   *   txId,
   *   true
   * );
   * ```
   */
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string,
    txId: number,
    forceComplete: boolean,
    txOptions: TransactionOverrides
  ): Promise<void>;

  /**
   * This function pays out the amounts specified to the workers and sets the URL of the final results file.
   * @remarks Only Reputation Oracle or admin can call it.
   * @param escrowAddress - Escrow address to payout.
   * @param recipients - Array of recipient addresses.
   * @param amounts - Array of amounts the recipients will receive.
   * @param finalResultsUrl - Final results file URL.
   * @param finalResultsHash - Final results file hash.
   * @param payoutId - Payout ID.
   * @param forceComplete - Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorRecipientCannotBeEmptyArray If the recipients array is empty
   * @throws ErrorTooManyRecipients If there are too many recipients
   * @throws ErrorAmountsCannotBeEmptyArray If the amounts array is empty
   * @throws ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths
   * @throws InvalidEthereumAddressError If any recipient address is invalid
   * @throws ErrorInvalidUrl If the final results URL is invalid
   * @throws ErrorHashIsEmptyString If the final results hash is empty
   * @throws ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   * @throws ErrorBulkPayOutVersion If using deprecated signature
   *
   * @example
   *
   * ```ts
   * import { ethers } from 'ethers';
   * import { v4 as uuidV4 } from 'uuid';
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
   * const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const payoutId = uuidV4();
   *
   * await escrowClient.bulkPayOut(
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   recipients,
   *   amounts,
   *   resultsUrl,
   *   resultsHash,
   *   payoutId,
   *   true
   * );
   * ```
   */
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string,
    payoutId: string,
    forceComplete: boolean,
    txOptions: TransactionOverrides
  ): Promise<void>;

  @requiresSigner
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string,
    id: number | string,
    forceComplete: boolean,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    await this.ensureCorrectBulkPayoutInput(
      escrowAddress,
      recipients,
      amounts,
      finalResultsUrl,
      finalResultsHash
    );

    const escrowContract = this.getEscrowContract(escrowAddress);
    const idIsString = typeof id === 'string';

    try {
      const txFactory = (overrides: Overrides) =>
        idIsString
          ? escrowContract[
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](
              recipients,
              amounts,
              finalResultsUrl,
              finalResultsHash,
              id,
              forceComplete,
              overrides
            )
          : escrowContract[
              'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
            ](
              recipients,
              amounts,
              finalResultsUrl,
              finalResultsHash,
              id,
              forceComplete,
              overrides
            );

      await this.sendTxAndWait(txFactory, txOptions);
    } catch (e) {
      if (!idIsString && e.reason === 'DEPRECATED_SIGNATURE') {
        throw ErrorBulkPayOutVersion;
      }
      // eslint-disable-next-line no-console
      console.warn(WarnVersionMismatch);
      return throwError(e);
    }
  }

  /**
   * This function cancels the specified escrow and sends the balance to the canceler.
   * @remarks Only Job Launcher or admin can call it.
   * @param escrowAddress - Address of the escrow to cancel.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   *
   * ```ts
   * await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async cancel(
    escrowAddress: string,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      await this.sendTxAndWait(
        (overrides) => escrowContract.cancel(overrides),
        txOptions
      );
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function requests the cancellation of the specified escrow (moves status to ToCancel or finalizes if expired).
   * @remarks Only Job Launcher or admin can call it.
   * @param escrowAddress - Address of the escrow to request cancellation.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   *
   * ```ts
   * await escrowClient.requestCancellation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async requestCancellation(
    escrowAddress: string,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      await this.sendTxAndWait(
        (overrides) => escrowContract.requestCancellation(overrides),
        txOptions
      );
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function withdraws additional tokens in the escrow to the canceler.
   * @remarks Only Job Launcher or admin can call it.
   *
   * @param escrowAddress - Address of the escrow to withdraw.
   * @param tokenAddress - Address of the token to withdraw.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns the escrow withdrawal data including transaction hash and withdrawal amount.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorInvalidTokenAddress If the token address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   * @throws ErrorTransferEventNotFoundInTransactionLogs If the Transfer event is not found in transaction logs
   *
   * @example
   *
   * ```ts
   * const withdrawData = await escrowClient.withdraw(
   *  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *  '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
   * );
   * console.log('Withdrawn amount:', withdrawData.withdrawnAmount);
   * ```
   */
  @requiresSigner
  async withdraw(
    escrowAddress: string,
    tokenAddress: string,
    txOptions: TransactionOverrides = {}
  ): Promise<IEscrowWithdraw> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!ethers.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      const transactionReceipt = await this.sendTxAndWait(
        (overrides) => escrowContract.withdraw(tokenAddress, overrides),
        txOptions
      );

      let amountTransferred: bigint | undefined = undefined;

      const tokenContract: ERC20 = ERC20__factory.connect(
        tokenAddress,
        this.runner
      );
      if (transactionReceipt)
        for (const log of transactionReceipt.logs) {
          if (log.address === tokenAddress) {
            const parsedLog = tokenContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });

            const from = parsedLog?.args[0];
            if (parsedLog?.name === 'Transfer' && from === escrowAddress) {
              amountTransferred = BigInt(parsedLog?.args[2]);
              break;
            }
          }
        }

      if (amountTransferred === undefined) {
        throw ErrorTransferEventNotFoundInTransactionLogs;
      }

      return {
        txHash: transactionReceipt?.hash || '',
        tokenAddress,
        withdrawnAmount: amountTransferred,
      };
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Creates a prepared transaction for bulk payout without immediately sending it.
   * @remarks Only Reputation Oracle or admin can call it.
   *
   * @param escrowAddress - Escrow address to payout.
   * @param recipients - Array of recipient addresses.
   * @param amounts - Array of amounts the recipients will receive.
   * @param finalResultsUrl - Final results file URL.
   * @param finalResultsHash - Final results file hash.
   * @param payoutId - Payout ID to identify the payout.
   * @param forceComplete - Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns object with raw transaction and nonce
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorRecipientCannotBeEmptyArray If the recipients array is empty
   * @throws ErrorTooManyRecipients If there are too many recipients
   * @throws ErrorAmountsCannotBeEmptyArray If the amounts array is empty
   * @throws ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths
   * @throws InvalidEthereumAddressError If any recipient address is invalid
   * @throws ErrorInvalidUrl If the final results URL is invalid
   * @throws ErrorHashIsEmptyString If the final results hash is empty
   * @throws ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   *
   * ```ts
   * import { ethers } from 'ethers';
   * import { v4 as uuidV4 } from 'uuid';
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
   * const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const payoutId = uuidV4();
   *
   * const rawTransaction = await escrowClient.createBulkPayoutTransaction(
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   recipients,
   *   amounts,
   *   resultsUrl,
   *   resultsHash,
   *   payoutId
   * );
   * console.log('Raw transaction:', rawTransaction);
   *
   * const signedTransaction = await signer.signTransaction(rawTransaction);
   * console.log('Tx hash:', ethers.keccak256(signedTransaction));
   * await signer.sendTransaction(rawTransaction);
   * ```
   */
  @requiresSigner
  async createBulkPayoutTransaction(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string,
    payoutId: string,
    forceComplete = false,
    txOptions: Overrides = {}
  ): Promise<TransactionLikeWithNonce> {
    await this.ensureCorrectBulkPayoutInput(
      escrowAddress,
      recipients,
      amounts,
      finalResultsUrl,
      finalResultsHash
    );

    const signer = this.runner as Signer;
    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      const populatedTransaction = await escrowContract[
        'bulkPayOut(address[],uint256[],string,string,string,bool)'
      ].populateTransaction(
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        payoutId,
        forceComplete,
        txOptions
      );

      /**
       * Safety-belt: explicitly set the passed nonce
       * because 'populateTransaction' return value
       * doesn't mention it even in library docs,
       * even though it includes if from txOptions.
       */
      if (typeof txOptions.nonce === 'number') {
        populatedTransaction.nonce = txOptions.nonce;
      } else {
        populatedTransaction.nonce = await signer.getNonce();
      }
      /**
       * It's needed to get all necessary info for tx object
       * before signing it, e.g.:
       * - type
       * - chainId
       * - fees params
       * - etc.
       *
       * All information is needed in order to get proper hash value
       */
      const preparedTransaction =
        await signer.populateTransaction(populatedTransaction);

      return preparedTransaction as TransactionLikeWithNonce;
    } catch (e) {
      return throwError(e);
    }
  }

  private async ensureCorrectBulkPayoutInput(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (recipients.length === 0) {
      throw ErrorRecipientCannotBeEmptyArray;
    }

    if (recipients.length > ESCROW_BULK_PAYOUT_MAX_ITEMS) {
      throw ErrorTooManyRecipients;
    }

    if (amounts.length === 0) {
      throw ErrorAmountsCannotBeEmptyArray;
    }

    if (recipients.length !== amounts.length) {
      throw ErrorRecipientAndAmountsMustBeSameLength;
    }

    recipients.forEach((recipient) => {
      if (!ethers.isAddress(recipient)) {
        throw new InvalidEthereumAddressError(recipient);
      }
    });

    if (!finalResultsUrl) {
      throw ErrorInvalidUrl;
    }

    if (!isValidUrl(finalResultsUrl)) {
      throw ErrorInvalidUrl;
    }

    if (!finalResultsHash) {
      throw ErrorHashIsEmptyString;
    }

    const balance = await this.getBalance(escrowAddress);

    let totalAmount = 0n;
    amounts.forEach((amount) => {
      totalAmount = totalAmount + amount;
    });

    if (balance < totalAmount) {
      throw ErrorEscrowDoesNotHaveEnoughBalance;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }
  }

  /**
   * This function returns the balance for a specified escrow address.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Balance of the escrow in the token used to fund it.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const balance = await escrowClient.getBalance('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Balance:', balance);
   * ```
   */
  async getBalance(escrowAddress: string): Promise<bigint> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      try {
        return await escrowContract.remainingFunds();
      } catch {
        // Use getBalance() method below if remainingFunds() is not available
      }

      return await escrowContract.getBalance();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the reserved funds for a specified escrow address.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Reserved funds of the escrow in the token used to fund it.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const reservedFunds = await escrowClient.getReservedFunds('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Reserved funds:', reservedFunds);
   * ```
   */
  async getReservedFunds(escrowAddress: string): Promise<bigint> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      return await escrowContract.reservedFunds();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the manifest file hash.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Hash of the manifest file content.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const manifestHash = await escrowClient.getManifestHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Manifest hash:', manifestHash);
   * ```
   */
  async getManifestHash(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.manifestHash();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the manifest. Could be a URL or a JSON string.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Manifest URL or JSON string.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const manifest = await escrowClient.getManifest('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Manifest:', manifest);
   * ```
   */
  async getManifest(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.manifestUrl();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the results file URL.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Results file URL.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const resultsUrl = await escrowClient.getResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Results URL:', resultsUrl);
   * ```
   */
  async getResultsUrl(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.finalResultsUrl();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the intermediate results file URL.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns URL of the file that stores results from Recording Oracle.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Intermediate results URL:', intermediateResultsUrl);
   * ```
   */
  async getIntermediateResultsUrl(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.intermediateResultsUrl();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the intermediate results hash.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Hash of the intermediate results file content.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const intermediateResultsHash = await escrowClient.getIntermediateResultsHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Intermediate results hash:', intermediateResultsHash);
   * ```
   */
  async getIntermediateResultsHash(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.intermediateResultsHash();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the token address used for funding the escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the token used to fund the escrow.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const tokenAddress = await escrowClient.getTokenAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Token address:', tokenAddress);
   * ```
   */
  async getTokenAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.token();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the current status of the escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Current status of the escrow.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * import { EscrowStatus } from '@human-protocol/sdk';
   *
   * const status = await escrowClient.getStatus('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Status:', EscrowStatus[status]);
   * ```
   */
  async getStatus(escrowAddress: string): Promise<EscrowStatus> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return Number(await escrowContract.status());
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the recording oracle address for a given escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the Recording Oracle.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const oracleAddress = await escrowClient.getRecordingOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Recording Oracle address:', oracleAddress);
   * ```
   */
  async getRecordingOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.recordingOracle();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the job launcher address for a given escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the Job Launcher.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const jobLauncherAddress = await escrowClient.getJobLauncherAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Job Launcher address:', jobLauncherAddress);
   * ```
   */
  async getJobLauncherAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.launcher();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the reputation oracle address for a given escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the Reputation Oracle.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const oracleAddress = await escrowClient.getReputationOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Reputation Oracle address:', oracleAddress);
   * ```
   */
  async getReputationOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.reputationOracle();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the exchange oracle address for a given escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the Exchange Oracle.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const oracleAddress = await escrowClient.getExchangeOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Exchange Oracle address:', oracleAddress);
   * ```
   */
  async getExchangeOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.exchangeOracle();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the escrow factory address for a given escrow.
   *
   * @param escrowAddress - Address of the escrow.
   * @returns Address of the escrow factory.
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * const factoryAddress = await escrowClient.getFactoryAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * console.log('Factory address:', factoryAddress);
   * ```
   */
  async getFactoryAddress(escrowAddress: string): Promise<string> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      return escrowContract.escrowFactory();
    } catch (e) {
      return throwError(e);
    }
  }
}
