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
import gqlFetch from 'graphql-request';
import { BaseEthersClient } from './base';
import { ESCROW_BULK_PAYOUT_MAX_ITEMS, NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId, OrderDirection } from './enums';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorBulkPayOutVersion,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
  ErrorInvalidAddress,
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
} from './error';
import {
  EscrowData,
  GET_CANCELLATION_REFUNDS_QUERY,
  GET_CANCELLATION_REFUND_BY_ADDRESS_QUERY,
  GET_ESCROWS_QUERY,
  GET_ESCROW_BY_ADDRESS_QUERY,
  GET_PAYOUTS_QUERY,
  GET_STATUS_UPDATES_QUERY,
  StatusEvent,
} from './graphql';
import {
  IEscrow,
  IEscrowConfig,
  IEscrowsFilter,
  IPayoutFilter,
  IStatusEventFilter,
} from './interfaces';
import {
  CancellationRefund,
  EscrowStatus,
  EscrowWithdraw,
  NetworkData,
  Payout,
  TransactionLikeWithNonce,
} from './types';
import {
  getSubgraphUrl,
  getUnixTimestamp,
  isValidJson,
  isValidUrl,
  throwError,
} from './utils';

/**
 * ## Introduction
 *
 * This client enables performing actions on Escrow contracts and obtaining information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner): Promise<EscrowClient>;
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model to send transactions calling the contract functions.
 * - **Provider**: when the user wants to use this model to get information from the contracts or subgraph.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ### Signer
 *
 * **Using private key (backend)**
 *
 * ```ts
 * import { EscrowClient } from '@human-protocol/sdk';
 * import { Wallet, providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY';
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const escrowClient = await EscrowClient.build(signer);
 * ```
 *
 * **Using Wagmi (frontend)**
 *
 * ```ts
 * import { useSigner, useChainId } from 'wagmi';
 * import { EscrowClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const escrowClient = await EscrowClient.build(signer);
 * ```
 *
 * ### Provider
 *
 * ```ts
 * import { EscrowClient } from '@human-protocol/sdk';
 * import { providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const escrowClient = await EscrowClient.build(provider);
 * ```
 */
export class EscrowClient extends BaseEthersClient {
  private escrowFactoryContract: EscrowFactory;

  /**
   * **EscrowClient constructor**
   *
   * @param {ContractRunner} runner The Runner object to interact with the Ethereum network
   * @param {NetworkData} networkData The network information required to connect to the Escrow contract
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
   * @param {ContractRunner} runner The Runner object to interact with the Ethereum network
   *
   * @returns {Promise<EscrowClient>} An instance of EscrowClient
   * @throws {ErrorProviderDoesNotExist} Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} Thrown if the network's chainId is not supported
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
   *
   * @param {string} tokenAddress Token address to use for payouts.
   * @param {string} jobRequesterId Job Requester Id
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns {Promise<string>} Returns the address of the escrow created.
   *
   *
   * **Code example**
   *
   * > Need to have available stake.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
   * const jobRequesterId = "job-requester-id";
   * const escrowAddress = await escrowClient.createEscrow(tokenAddress, jobRequesterId);
   * ```
   */
  @requiresSigner
  public async createEscrow(
    tokenAddress: string,
    jobRequesterId: string,
    txOptions: Overrides = {}
  ): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    try {
      const result = await (
        await this.escrowFactoryContract.createEscrow(
          tokenAddress,
          jobRequesterId,
          this.applyTxDefaults(txOptions)
        )
      ).wait();

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
   * @param {string} escrowAddress Address of the escrow to set up.
   * @param {IEscrowConfig} escrowConfig Escrow configuration parameters.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or admin can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const escrowAddress = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
   * const escrowConfig = {
   *    recordingOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    reputationOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    exchangeOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    recordingOracleFee: BigInt('10'),
   *    reputationOracleFee: BigInt('10'),
   *    exchangeOracleFee: BigInt('10'),
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
    txOptions: Overrides = {}
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

    if (!ethers.isAddress(recordingOracle)) {
      throw ErrorInvalidRecordingOracleAddressProvided;
    }

    if (!ethers.isAddress(reputationOracle)) {
      throw ErrorInvalidReputationOracleAddressProvided;
    }

    if (!ethers.isAddress(exchangeOracle)) {
      throw ErrorInvalidExchangeOracleAddressProvided;
    }

    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (
        await escrowContract.setup(
          reputationOracle,
          recordingOracle,
          exchangeOracle,
          reputationOracleFee,
          recordingOracleFee,
          exchangeOracleFee,
          manifest,
          manifestHash,
          this.applyTxDefaults(txOptions)
        )
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function adds funds of the chosen token to the escrow.
   *
   * @param {string} escrowAddress Address of the escrow to fund.
   * @param {bigint} amount Amount to be added as funds.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await escrowClient.fund('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
  async fund(
    escrowAddress: string,
    amount: bigint,
    txOptions: Overrides = {}
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
      await (
        await tokenContract.transfer(
          escrowAddress,
          amount,
          this.applyTxDefaults(txOptions)
        )
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function stores the results URL and hash.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {string} url Results file URL.
   * @param {string} hash Results file hash.
   * @param {bigint} fundsToReserve Funds to reserve for payouts
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Recording Oracle or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.storeResults('0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'http://localhost/results.json', 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079', ethers.parseEther('10'));
   * ```
   */

  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    fundsToReserve: bigint,
    txOptions?: Overrides
  ): Promise<void>;

  /**
   * This function stores the results URL and hash.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {string} url Results file URL.
   * @param {string} hash Results file hash.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Recording Oracle or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.storeResults('0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'http://localhost/results.json', 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079');
   * ```
   */
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    txOptions?: Overrides
  ): Promise<void>;

  @requiresSigner
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    a?: bigint | Overrides,
    b?: Overrides
  ): Promise<void> {
    const escrowContract = this.getEscrowContract(escrowAddress);

    const hasFundsToReserveParam = typeof a === 'bigint';
    const fundsToReserve = hasFundsToReserveParam ? (a as bigint) : null;
    const txOptions = (hasFundsToReserveParam ? b : a) || {};
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
      if (fundsToReserve !== null) {
        await (
          await escrowContract['storeResults(string,string,uint256)'](
            url,
            hash,
            fundsToReserve,
            this.applyTxDefaults(txOptions)
          )
        ).wait();
      } else {
        await (
          await escrowContract['storeResults(string,string)'](
            url,
            hash,
            this.applyTxDefaults(txOptions)
          )
        ).wait();
      }
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
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Recording Oracle or admin can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.complete('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async complete(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (
        await escrowContract.complete(this.applyTxDefaults(txOptions))
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function pays out the amounts specified to the workers and sets the URL of the final results file.
   *
   * @param {string} escrowAddress Escrow address to payout.
   * @param {string[]} recipients Array of recipient addresses.
   * @param {bigint[]} amounts Array of amounts the recipients will receive.
   * @param {string} finalResultsUrl Final results file URL.
   * @param {string} finalResultsHash Final results file hash.
   * @param {number} txId Transaction ID.
   * @param {boolean} forceComplete Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Reputation Oracle or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
   * const amounts = [ethers.parseUnits(5, 'ether'), ethers.parseUnits(10, 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const txId = 1;
   *
   * await escrowClient.bulkPayOut('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash, txId, true);
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
    txOptions: Overrides
  ): Promise<void>;

  /**
   * This function pays out the amounts specified to the workers and sets the URL of the final results file.
   *
   * @param {string} escrowAddress Escrow address to payout.
   * @param {string[]} recipients Array of recipient addresses.
   * @param {bigint[]} amounts Array of amounts the recipients will receive.
   * @param {string} finalResultsUrl Final results file URL.
   * @param {string} finalResultsHash Final results file hash.
   * @param {string} payoutId Payout ID.
   * @param {boolean} forceComplete Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Reputation Oracle or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   * import { v4 as uuidV4 } from 'uuid';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
   * const amounts = [ethers.parseUnits(5, 'ether'), ethers.parseUnits(10, 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const payoutId = uuidV4();
   *
   * await escrowClient.bulkPayOut('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash, payoutId, true);
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
    txOptions: Overrides
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
    txOptions: Overrides = {}
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
      if (idIsString) {
        await (
          await escrowContract[
            'bulkPayOut(address[],uint256[],string,string,string,bool)'
          ](
            recipients,
            amounts,
            finalResultsUrl,
            finalResultsHash,
            id,
            forceComplete,
            this.applyTxDefaults(txOptions)
          )
        ).wait();
      } else {
        await (
          await escrowContract[
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](
            recipients,
            amounts,
            finalResultsUrl,
            finalResultsHash,
            id,
            forceComplete,
            this.applyTxDefaults(txOptions)
          )
        ).wait();
      }
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
   *
   * @param {string} escrowAddress Address of the escrow to cancel.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async cancel(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      await (
        await escrowContract.cancel(this.applyTxDefaults(txOptions))
      ).wait();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function requests the cancellation of the specified escrow (moves status to ToCancel or finalizes if expired).
   *
   * @param {string} escrowAddress Address of the escrow to request cancellation.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   * **Code example**
   *
   * > Only Job Launcher or admin can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.requestCancellation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async requestCancellation(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);
      await (
        await escrowContract.requestCancellation(
          this.applyTxDefaults(txOptions)
        )
      ).wait();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function withdraws additional tokens in the escrow to the canceler.
   *
   * @param {string} escrowAddress Address of the escrow to withdraw.
   * @param {string} tokenAddress Address of the token to withdraw.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns {EscrowWithdraw} Returns the escrow withdrawal data including transaction hash and withdrawal amount. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.withdraw(
   *  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *  '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
   * );
   * ```
   */
  @requiresSigner
  async withdraw(
    escrowAddress: string,
    tokenAddress: string,
    txOptions: Overrides = {}
  ): Promise<EscrowWithdraw> {
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

      const transactionReceipt = await (
        await escrowContract.withdraw(
          tokenAddress,
          this.applyTxDefaults(txOptions)
        )
      ).wait();

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
              amountTransferred = parsedLog?.args[2];
              break;
            }
          }
        }

      if (amountTransferred === undefined) {
        throw ErrorTransferEventNotFoundInTransactionLogs;
      }

      const escrowWithdrawData: EscrowWithdraw = {
        txHash: transactionReceipt?.hash || '',
        tokenAddress,
        withdrawnAmount: amountTransferred,
      };

      return escrowWithdrawData;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Creates a prepared transaction for bulk payout without immediately sending it.
   * @param {string} escrowAddress Escrow address to payout.
   * @param {string[]} recipients Array of recipient addresses.
   * @param {bigint[]} amounts Array of amounts the recipients will receive.
   * @param {string} finalResultsUrl Final results file URL.
   * @param {string} finalResultsHash Final results file hash.
   * @param {string} payoutId Payout ID to identify the payout.
   * @param {boolean} forceComplete Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns object with raw transaction and signed transaction hash
   *
   * **Code example**
   *
   * > Only Reputation Oracle or admin can call it.
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
   * const amounts = [ethers.parseUnits(5, 'ether'), ethers.parseUnits(10, 'ether')];
   * const resultsUrl = 'http://localhost/results.json';
   * const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   * const payoutId = '372f6916-fe34-4711-b6e3-274f682047de';
   *
   * const rawTransaction = await escrowClient.createBulkPayoutTransaction('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash, txId);
   * console.log('Raw transaction:', rawTransaction);
   *
   * const signedTransaction = await signer.signTransaction(rawTransaction);
   * console.log('Tx hash:', ethers.keccak256(signedTransaction));
   * (await signer.sendTransaction(rawTransaction)).wait();
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
    txOptions = this.applyTxDefaults(txOptions);
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<bigint>} Balance of the escrow in the token used to fund it.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const balance = await escrowClient.getBalance('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<bigint>} Reserved funds of the escrow in the token used to fund it.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const reservedFunds = await escrowClient.getReservedFunds('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Hash of the manifest file content.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const manifestHash = await escrowClient.getManifestHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Url of the manifest.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const manifest = await escrowClient.getManifest('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Results file url.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const resultsUrl = await escrowClient.getResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Url of the file that store results from Recording Oracle.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Hash of the intermediate results file content.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const intermediateResultsHash = await escrowClient.getIntermediateResultsHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the token used to fund the escrow.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const tokenAddress = await escrowClient.getTokenAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<EscrowStatus>} Current status of the escrow.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const status = await escrowClient.getStatus('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the Recording Oracle.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const oracleAddress = await escrowClient.getRecordingOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the Job Launcher.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const jobLauncherAddress = await escrowClient.getJobLauncherAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the Reputation Oracle.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const oracleAddress = await escrowClient.getReputationOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the Exchange Oracle.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const oracleAddress = await escrowClient.getExchangeOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
   * @param {string} escrowAddress Address of the escrow.
   * @returns {Promise<string>} Address of the escrow factory.
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const escrowClient = await EscrowClient.build(provider);
   *
   * const factoryAddress = await escrowClient.getFactoryAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
/**
 * ## Introduction
 *
 * Utility class for escrow-related operations.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ### Signer
 *
 * **Using private key(backend)**
 *
 * ```ts
 * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
 *
 * const escrowAddresses = new EscrowUtils.getEscrows({
 *   chainId: ChainId.POLYGON_AMOY
 * });
 * ```
 */
export class EscrowUtils {
  /**
   * This function returns an array of escrows based on the specified filter parameters.
   *
   *
   * **Input parameters**
   *
   * ```ts
   * interface IEscrowsFilter {
   *   chainId: ChainId;
   *   launcher?: string;
   *   reputationOracle?: string;
   *   recordingOracle?: string;
   *   exchangeOracle?: string;
   *   jobRequesterId?: string;
   *   status?: EscrowStatus;
   *   from?: Date;
   *   to?: Date;
   *   first?: number;
   *   skip?: number;
   *   orderDirection?: OrderDirection;
   * }
   * ```
   *
   * ```ts
   * enum ChainId {
   *   ALL = -1,
   *   MAINNET = 1,
   *   SEPOLIA = 11155111,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_AMOY=80002,
   *   LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * enum OrderDirection {
   *   ASC = 'asc',
   *   DESC = 'desc',
   * }
   * ```
   *
   * ```ts
   * enum EscrowStatus {
   *   Launched,
   *   Pending,
   *   Partial,
   *   Paid,
   *   Complete,
   *   Cancelled,
   * }
   * ```
   *
   * ```ts
   * interface IEscrow {
   *   id: string;
   *   address: string;
   *   amountPaid: bigint;
   *   balance: bigint;
   *   count: bigint;
   *   factoryAddress: string;
   *   finalResultsUrl: string | null;
   *   finalResultsHash: string | null;
   *   intermediateResultsUrl: string | null;
   *   intermediateResultsHash: string | null;
   *   launcher: string;
   *   jobRequesterId: string | null;
   *   manifestHash: string | null;
   *   manifest: string | null;
   *   recordingOracle: string | null;
   *   reputationOracle: string | null;
   *   exchangeOracle: string | null;
   *   recordingOracleFee: number | null;
   *   reputationOracleFee: number | null;
   *   exchangeOracleFee: number | null;
   *   status: string;
   *   token: string;
   *   totalFundedAmount: bigint;
   *   createdAt: number;
   *   chainId: number;
   * };
   * ```
   *
   *
   * @param {IEscrowsFilter} filter Filter parameters.
   * @returns {IEscrow[]} List of escrows that match the filter.
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils, EscrowStatus } from '@human-protocol/sdk';
   *
   * const filters: IEscrowsFilter = {
   *   status: EscrowStatus.Pending,
   *   from: new Date(2023, 4, 8),
   *   to: new Date(2023, 5, 8),
   *   chainId: ChainId.POLYGON_AMOY
   * };
   * const escrows = await EscrowUtils.getEscrows(filters);
   * ```
   */
  public static async getEscrows(filter: IEscrowsFilter): Promise<IEscrow[]> {
    if (filter.launcher && !ethers.isAddress(filter.launcher)) {
      throw ErrorInvalidAddress;
    }

    if (filter.recordingOracle && !ethers.isAddress(filter.recordingOracle)) {
      throw ErrorInvalidAddress;
    }

    if (filter.reputationOracle && !ethers.isAddress(filter.reputationOracle)) {
      throw ErrorInvalidAddress;
    }

    if (filter.exchangeOracle && !ethers.isAddress(filter.exchangeOracle)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const networkData = NETWORKS[filter.chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    let statuses;
    if (filter.status !== undefined) {
      statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      statuses = statuses.map((status) => EscrowStatus[status]);
    }
    const { escrows } = await gqlFetch<{ escrows: EscrowData[] }>(
      getSubgraphUrl(networkData),
      GET_ESCROWS_QUERY(filter),
      {
        ...filter,
        launcher: filter.launcher?.toLowerCase(),
        reputationOracle: filter.reputationOracle?.toLowerCase(),
        recordingOracle: filter.recordingOracle?.toLowerCase(),
        exchangeOracle: filter.exchangeOracle?.toLowerCase(),
        status: statuses,
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      }
    );
    const mapped: IEscrow[] = (escrows || []).map((e) =>
      mapEscrow(e, networkData.chainId)
    );

    if (!escrows) {
      return [];
    }

    return mapped;
  }

  /**
   * This function returns the escrow data for a given address.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * enum ChainId {
   *   ALL = -1,
   *   MAINNET = 1,
   *   SEPOLIA = 11155111,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_AMOY = 80002,
   *   LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * interface IEscrow {
   *   id: string;
   *   address: string;
   *   amountPaid: bigint;
   *   balance: bigint;
   *   count: bigint;
   *   factoryAddress: string;
   *   finalResultsUrl: string | null;
   *   finalResultsHash: string | null;
   *   intermediateResultsUrl: string | null;
   *   intermediateResultsHash: string | null;
   *   launcher: string;
   *   jobRequesterId: string | null;
   *   manifestHash: string | null;
   *   manifest: string | null;
   *   recordingOracle: string | null;
   *   reputationOracle: string | null;
   *   exchangeOracle: string | null;
   *   recordingOracleFee: number | null;
   *   reputationOracleFee: number | null;
   *   exchangeOracleFee: number | null;
   *   status: string;
   *   token: string;
   *   totalFundedAmount: bigint;
   *   createdAt: number;
   *   chainId: number;
   * };
   * ```
   *
   *
   * @param {ChainId} chainId Network in which the escrow has been deployed
   * @param {string} escrowAddress Address of the escrow
   * @returns {Promise<IEscrow | null>} - Escrow data or null if not found.
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
   *
   * const escrow = new EscrowUtils.getEscrow(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
   * ```
   */
  public static async getEscrow(
    chainId: ChainId,
    escrowAddress: string
  ): Promise<IEscrow | null> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (escrowAddress && !ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    const { escrow } = await gqlFetch<{ escrow: EscrowData | null }>(
      getSubgraphUrl(networkData),
      GET_ESCROW_BY_ADDRESS_QUERY(),
      { escrowAddress: escrowAddress.toLowerCase() }
    );
    if (!escrow) return null;

    return mapEscrow(escrow, networkData.chainId);
  }

  /**
   * This function returns the status events for a given set of networks within an optional date range.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * enum ChainId {
   *   ALL = -1,
   *   MAINNET = 1,
   *   SEPOLIA = 11155111,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_AMOY = 80002,
   *   LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * enum OrderDirection {
   *   ASC = 'asc',
   *   DESC = 'desc',
   * }
   * ```
   *
   * ```ts
   * type Status = {
   *   escrowAddress: string;
   *   timestamp: string;
   *   status: string;
   * };
   * ```
   *
   * @param {IStatusEventFilter} filter Filter parameters.
   * @returns {Promise<StatusEvent[]>} - Array of status events with their corresponding statuses.
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils, EscrowStatus } from '@human-protocol/sdk';
   *
   * (async () => {
   *   const fromDate = new Date('2023-01-01');
   *   const toDate = new Date('2023-12-31');
   *   const statusEvents = await EscrowUtils.getStatusEvents({
   *     chainId: ChainId.POLYGON,
   *     statuses: [EscrowStatus.Pending, EscrowStatus.Complete],
   *     from: fromDate,
   *     to: toDate
   *   });
   *   console.log(statusEvents);
   * })();
   * ```
   */
  public static async getStatusEvents(
    filter: IStatusEventFilter
  ): Promise<StatusEvent[]> {
    const {
      chainId,
      statuses,
      from,
      to,
      launcher,
      first = 10,
      skip = 0,
      orderDirection = OrderDirection.DESC,
    } = filter;

    if (launcher && !ethers.isAddress(launcher)) {
      throw ErrorInvalidAddress;
    }

    const networkData = NETWORKS[chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    // If statuses are not provided, use all statuses except Launched
    const effectiveStatuses = statuses ?? [
      EscrowStatus.Launched,
      EscrowStatus.Pending,
      EscrowStatus.Partial,
      EscrowStatus.Paid,
      EscrowStatus.Complete,
      EscrowStatus.Cancelled,
    ];

    const statusNames = effectiveStatuses.map((status) => EscrowStatus[status]);

    const data = await gqlFetch<{
      escrowStatusEvents: StatusEvent[];
    }>(
      getSubgraphUrl(networkData),
      GET_STATUS_UPDATES_QUERY(from, to, launcher),
      {
        status: statusNames,
        from: from ? getUnixTimestamp(from) : undefined,
        to: to ? getUnixTimestamp(to) : undefined,
        launcher: launcher || undefined,
        orderDirection,
        first: Math.min(first, 1000),
        skip,
      }
    );

    if (!data || !data['escrowStatusEvents']) {
      return [];
    }

    const statusEvents = data['escrowStatusEvents'] as StatusEvent[];

    const eventsWithChainId = statusEvents.map((event) => ({
      ...event,
      chainId,
    }));

    return eventsWithChainId;
  }

  /**
   * This function returns the payouts for a given set of networks.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   * Fetch payouts from the subgraph.
   *
   * @param {IPayoutFilter} filter Filter parameters.
   * @returns {Promise<Payout[]>} List of payouts matching the filters.
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
   *
   * const payouts = await EscrowUtils.getPayouts({
   *   chainId: ChainId.POLYGON,
   *   escrowAddress: '0x1234567890123456789012345678901234567890',
   *   recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
   *   from: new Date('2023-01-01'),
   *   to: new Date('2023-12-31')
   * });
   * console.log(payouts);
   * ```
   */
  public static async getPayouts(filter: IPayoutFilter): Promise<Payout[]> {
    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    if (filter.escrowAddress && !ethers.isAddress(filter.escrowAddress)) {
      throw ErrorInvalidAddress;
    }
    if (filter.recipient && !ethers.isAddress(filter.recipient)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const { payouts } = await gqlFetch<{ payouts: Payout[] }>(
      getSubgraphUrl(networkData),
      GET_PAYOUTS_QUERY(filter),
      {
        escrowAddress: filter.escrowAddress?.toLowerCase(),
        recipient: filter.recipient?.toLowerCase(),
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        first: Math.min(first, 1000),
        skip,
        orderDirection,
      }
    );

    return payouts || [];
  }

  /**
   * This function returns the cancellation refunds for a given set of networks.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * enum ChainId {
   *  ALL = -1,
   *  MAINNET = 1,
   *  SEPOLIA = 11155111,
   *  BSC_MAINNET = 56,
   *  BSC_TESTNET = 97,
   *  POLYGON = 137,
   *  POLYGON_AMOY = 80002,
   *  LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * type CancellationRefund = {
   *   id: string;
   *   escrowAddress: string;
   *   receiver: string;
   *   amount: bigint;
   *   block: number;
   *   timestamp: number;
   *   txHash: string;
   * };
   * ```
   *
   *
   * @param {Object} filter Filter parameters.
   * @returns {Promise<CancellationRefund[]>} List of cancellation refunds matching the filters.
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
   *
   * const cancellationRefunds = await EscrowUtils.getCancellationRefunds({
   *    chainId: ChainId.POLYGON_AMOY,
   *    escrowAddress: '0x1234567890123456789012345678901234567890',
   * });
   * console.log(cancellationRefunds);
   * ```
   */
  public static async getCancellationRefunds(filter: {
    chainId: ChainId;
    escrowAddress?: string;
    receiver?: string;
    from?: Date;
    to?: Date;
    first?: number;
    skip?: number;
    orderDirection?: OrderDirection;
  }): Promise<CancellationRefund[]> {
    const networkData = NETWORKS[filter.chainId];
    if (!networkData) throw ErrorUnsupportedChainID;
    if (filter.escrowAddress && !ethers.isAddress(filter.escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }
    if (filter.receiver && !ethers.isAddress(filter.receiver)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const { cancellationRefundEvents } = await gqlFetch<{
      cancellationRefundEvents: CancellationRefund[];
    }>(getSubgraphUrl(networkData), GET_CANCELLATION_REFUNDS_QUERY(filter), {
      escrowAddress: filter.escrowAddress?.toLowerCase(),
      receiver: filter.receiver?.toLowerCase(),
      from: filter.from ? getUnixTimestamp(filter.from) : undefined,
      to: filter.to ? getUnixTimestamp(filter.to) : undefined,
      first,
      skip,
      orderDirection,
    });

    return cancellationRefundEvents || [];
  }

  /**
   * This function returns the cancellation refund for a given escrow address.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * enum ChainId {
   *  ALL = -1,
   *  MAINNET = 1,
   *  SEPOLIA = 11155111,
   *  BSC_MAINNET = 56,
   *  BSC_TESTNET = 97,
   *  POLYGON = 137,
   *  POLYGON_AMOY = 80002,
   *  LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * type CancellationRefund = {
   *   id: string;
   *   escrowAddress: string;
   *   receiver: string;
   *   amount: bigint;
   *   block: number;
   *   timestamp: number;
   *   txHash: string;
   * };
   * ```
   *
   *
   * @param {ChainId} chainId Network in which the escrow has been deployed
   * @param {string} escrowAddress Address of the escrow
   * @returns {Promise<CancellationRefund>} Cancellation refund data
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
   *
   * const cancellationRefund = await EscrowUtils.getCancellationRefund(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
   * ```
   */
  public static async getCancellationRefund(
    chainId: ChainId,
    escrowAddress: string
  ): Promise<CancellationRefund> {
    const networkData = NETWORKS[chainId];
    if (!networkData) throw ErrorUnsupportedChainID;

    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    const { cancellationRefundEvents } = await gqlFetch<{
      cancellationRefundEvents: any;
    }>(
      getSubgraphUrl(networkData),
      GET_CANCELLATION_REFUND_BY_ADDRESS_QUERY(),
      { escrowAddress: escrowAddress.toLowerCase() }
    );

    return cancellationRefundEvents?.[0] || null;
  }
}

function mapEscrow(e: EscrowData, chainId: ChainId | number): IEscrow {
  return {
    id: e.id,
    address: e.address,
    amountPaid: BigInt(e.amountPaid || 0),
    balance: BigInt(e.balance || 0),
    count: BigInt(e.count || 0),
    factoryAddress: e.factoryAddress,
    finalResultsUrl: e.finalResultsUrl,
    finalResultsHash: e.finalResultsHash,
    intermediateResultsUrl: e.intermediateResultsUrl,
    intermediateResultsHash: e.intermediateResultsHash,
    launcher: e.launcher,
    jobRequesterId: e.jobRequesterId,
    manifestHash: e.manifestHash,
    manifest: e.manifest,
    recordingOracle: e.recordingOracle,
    reputationOracle: e.reputationOracle,
    exchangeOracle: e.exchangeOracle,
    recordingOracleFee: e.recordingOracleFee
      ? Number(e.recordingOracleFee)
      : null,
    reputationOracleFee: e.reputationOracleFee
      ? Number(e.reputationOracleFee)
      : null,
    exchangeOracleFee: e.exchangeOracleFee ? Number(e.exchangeOracleFee) : null,
    status: e.status,
    token: e.token,
    totalFundedAmount: BigInt(e.totalFundedAmount || 0),
    createdAt: Number(e.createdAt || 0) * 1000,
    chainId: Number(chainId),
  };
}
