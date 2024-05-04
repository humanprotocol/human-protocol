/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, EventLog, Overrides, ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { BaseEthersClient } from './base';
import { DEFAULT_TX_ID, NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId } from './enums';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
  ErrorInvalidAddress,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidExchangeOracleAddressProvided,
  ErrorInvalidRecordingOracleAddressProvided,
  ErrorInvalidReputationOracleAddressProvided,
  ErrorInvalidTokenAddress,
  ErrorInvalidUrl,
  ErrorLaunchedEventIsNotEmitted,
  ErrorListOfHandlersCannotBeEmpty,
  ErrorProviderDoesNotExist,
  ErrorRecipientAndAmountsMustBeSameLength,
  ErrorRecipientCannotBeEmptyArray,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorTransferEventNotFoundInTransactionLogs,
  ErrorUnsupportedChainID,
  ErrorUrlIsEmptyString,
  InvalidEthereumAddressError,
} from './error';
import {
  EscrowData,
  GET_ESCROWS_QUERY,
  GET_ESCROW_BY_ADDRESS_QUERY,
} from './graphql';
import { IEscrowConfig, IEscrowsFilter } from './interfaces';
import { EscrowCancel, EscrowStatus, NetworkData } from './types';
import { isValidUrl, throwError } from './utils';

/**
 * ## Introduction
 *
 * This client enables to perform actions on Escrow contracts and obtain information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner);
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
 * - **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.
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
 * import { EscrowClient } from '@human-protocol/sdk';
 * import { Wallet, providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY'
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const escrowClient = await EscrowClient.build(signer);
 * ```
 *
 * **Using Wagmi(frontend)**
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
   * @param {NetworkData} network The network information required to connect to the Escrow contract
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
  public static async build(runner: ContractRunner) {
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
   * @param {string} tokenAddress Token address to use for pay outs.
   * @param {string[]} trustedHandlers Array of addresses that can perform actions on the contract.
   * @param {string} jobRequesterId Job Requester Id
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns {Promise<string>} Return the address of the escrow created.
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
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
   * const trustedHandlers = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
   * const jobRequesterId = "job-requester-id";
   * const escrowAddress = await escrowClient.createEscrow(tokenAddress, trustedHandlers, jobRequesterId);
   * ```
   */
  @requiresSigner
  public async createEscrow(
    tokenAddress: string,
    trustedHandlers: string[],
    jobRequesterId: string,
    txOptions: Overrides = {}
  ): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.isAddress(trustedHandler)) {
        throw new InvalidEthereumAddressError(trustedHandler);
      }
    });

    try {
      const result = await (
        await this.escrowFactoryContract.createEscrow(
          tokenAddress,
          trustedHandlers,
          jobRequesterId,
          txOptions
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
   * > Only Job Launcher or a trusted handler can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
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
   *    recordingOracleFee: bigint.from('10'),
   *    reputationOracleFee: bigint.from('10'),
   *    exchangeOracleFee: bigint.from('10'),
   *    manifestUrl: 'htttp://localhost/manifest.json',
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
      manifestUrl,
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

    if (!manifestUrl) {
      throw ErrorUrlIsEmptyString;
    }

    if (!isValidUrl(manifestUrl)) {
      throw ErrorInvalidUrl;
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
          manifestUrl,
          manifestHash,
          txOptions
        )
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function creates and sets up an escrow.
   *
   * @param {string} tokenAddress Token address to use for pay outs.
   * @param {string[]} trustedHandlers Array of addresses that can perform actions on the contract.
   * @param {string} jobRequesterId Job Requester Id
   * @param {IEscrowConfig} escrowConfig Configuration object with escrow settings.
   * @returns {Promise<string>} Returns the address of the escrow created.
   *
   *
   * **Code example**
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
   * const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
   * const trustedHandlers = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
   * const jobRequesterId = "job-requester-id";
   *
   * const escrowConfig = {
   *    recordingOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    reputationOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    exchangeOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    recordingOracleFee: bigint.from('10'),
   *    reputationOracleFee: bigint.from('10'),
   *    exchangeOracleFee: bigint.from('10'),
   *    manifestUrl: 'htttp://localhost/manifest.json',
   *    manifestHash: 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079',
   * };
   *
   * const escrowAddress = await escrowClient.createAndSetupEscrow(tokenAddress, trustedHandlers, jobRequesterId, escrowConfig);
   * ```
   */
  @requiresSigner
  async createAndSetupEscrow(
    tokenAddress: string,
    trustedHandlers: string[],
    jobRequesterId: string,
    escrowConfig: IEscrowConfig
  ): Promise<string> {
    try {
      const escrowAddress = await this.createEscrow(
        tokenAddress,
        trustedHandlers,
        jobRequesterId
      );

      await this.setup(escrowAddress, escrowConfig);

      return escrowAddress;
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
   * const privateKey = 'YOUR_PRIVATE_KEY'
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
        await tokenContract.transfer(escrowAddress, amount, txOptions)
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function stores the results url and hash.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {string} url Results file url.
   * @param {string} hash Results file hash.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Recording Oracle or a trusted handler can call it.
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
   * await storeResults.storeResults('0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'http://localhost/results.json', 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079');
   * ```
   */
  @requiresSigner
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!url) {
      throw ErrorUrlIsEmptyString;
    }

    if (!isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    if (!hash) {
      throw ErrorHashIsEmptyString;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (await escrowContract.storeResults(url, hash, txOptions)).wait();

      return;
    } catch (e) {
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
   * > Only Recording Oracle or a trusted handler can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
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

      await (await escrowContract.complete(txOptions)).wait();
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
   * @param {string} finalResultsUrl Final results file url.
   * @param {string} finalResultsHash Final results file hash.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Reputation Oracle or a trusted handler can call it.
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
   * const resultsHash'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
   *
   * await escrowClient.bulkPayOut('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash);
   * ```
   */
  @requiresSigner
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: bigint[],
    finalResultsUrl: string,
    finalResultsHash: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (recipients.length === 0) {
      throw ErrorRecipientCannotBeEmptyArray;
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
      throw ErrorUrlIsEmptyString;
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

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (
        await escrowContract.bulkPayOut(
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash,
          DEFAULT_TX_ID,
          txOptions
        )
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function cancels the specified escrow and sends the balance to the canceler.
   *
   * @param {string} escrowAddress Address of the escrow to cancel.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns {EscrowCancel} Returns the escrow cancellation data including transaction hash and refunded amount. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or a trusted handler can call it.
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
   * await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async cancel(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<EscrowCancel> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      const transactionReceipt = await (
        await escrowContract.cancel(txOptions)
      ).wait();

      let amountTransferred: bigint | undefined = undefined;
      const tokenAddress = await escrowContract.token();

      const tokenContract: HMToken = HMToken__factory.connect(
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

      const escrowCancelData: EscrowCancel = {
        txHash: transactionReceipt?.hash || '',
        amountRefunded: amountTransferred,
      };

      return escrowCancelData;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function cancels the specified escrow, sends the balance to the canceler and selfdestructs the escrow contract.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or trusted handler can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * await escrowClient.abort('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  async abort(escrowAddress: string, txOptions: Overrides = {}): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (await escrowContract.abort(txOptions)).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function sets the status of an escrow to completed.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @param {string[]} trustedHandlers Array of addresses of trusted handlers to add.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Only Job Launcher or trusted handler can call it.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const trustedHandlers = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
   * await escrowClient.addTrustedHandlers('0x62dD51230A30401C455c8398d06F85e4EaB6309f', trustedHandlers);
   * ```
   */
  @requiresSigner
  async addTrustedHandlers(
    escrowAddress: string,
    trustedHandlers: string[],
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (trustedHandlers.length === 0) {
      throw ErrorListOfHandlersCannotBeEmpty;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.isAddress(trustedHandler)) {
        throw new InvalidEthereumAddressError(trustedHandler);
      }
    });

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const escrowContract = this.getEscrowContract(escrowAddress);

      await (
        await escrowContract.addTrustedHandlers(trustedHandlers, txOptions)
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the balance for a specified escrow address.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {bigint} Balance of the escrow in the token used to fund it.
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
   * const escrowClient = await EscrowClient.build(signer);
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

      return escrowContract.getBalance();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the manifest file hash.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {string} Hash of the manifest file content.
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
   * const escrowClient = await EscrowClient.build(signer);
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
   * This function returns the manifest file URL.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {string} Url of the manifest.
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
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const manifestUrl = await escrowClient.getManifestUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  async getManifestUrl(escrowAddress: string): Promise<string> {
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
   * @returns {string} Results file url.
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
   * const escrowClient = await EscrowClient.build(signer);
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
   * @returns {string} Url of the file that store results from Recording Oracle.
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
   * const escrowClient = await EscrowClient.build(signer);
   *
   * const intemediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the token address used for funding the escrow.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {string} Address of the token used to fund the escrow.
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
   * const escrowClient = await EscrowClient.build(signer);
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
   * @returns {EscrowStatus} Current status of the escrow.
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
   * const escrowClient = await EscrowClient.build(signer);
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
   * @returns {string} Address of the Recording Oracle.
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
   * const escrowClient = await EscrowClient.build(signer);
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the job launcher address for a given escrow.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {string} Address of the Job Launcher.
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
   * const escrowClient = await EscrowClient.build(signer);
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the reputation oracle address for a given escrow.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {EscrowStatus} Address of the Reputation Oracle.
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
   * const escrowClient = await EscrowClient.build(signer);
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the exchange oracle address for a given escrow.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {EscrowStatus} Address of the Exchange Oracle.
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
   * const escrowClient = await EscrowClient.build(signer);
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the escrow factory address for a given escrow.
   *
   * @param {string} escrowAddress Address of the escrow.
   * @returns {EscrowStatus} Address of the escrow factory.
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
   * const escrowClient = await EscrowClient.build(signer);
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
    } catch (e: any) {
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
 *   networks: [ChainId.POLYGON_AMOY]
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
   *   networks: ChainId[];
   *   launcher?: string;
   *   reputationOracle?: string;
   *   recordingOracle?: string;
   *   exchangeOracle?: string;
   *   jobRequesterId?: string;
   *   status?: EscrowStatus;
   *   from?: Date;
   *   to?: Date;
   * }
   * ```
   *
   * ```ts
   * enum ChainId {
   *   ALL = -1,
   *   MAINNET = 1,
   *   RINKEBY = 4,
   *   GOERLI = 5,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_MUMBAI = 80001,
   *   POLYGON_AMOY=80002,
   *   MOONBEAM = 1284,
   *   MOONBASE_ALPHA = 1287,
   *   AVALANCHE = 43114,
   *   AVALANCHE_TESTNET = 43113,
   *   CELO = 42220,
   *   CELO_ALFAJORES = 44787,
   *   SKALE = 1273227453,
   *   LOCALHOST = 1338,
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
   * type EscrowData = {
   *   id: string;
   *   address: string;
   *   amountPaid: string;
   *   balance: string;
   *   count: string;
   *   jobRequesterId: string;
   *   factoryAddress: string;
   *   finalResultsUrl?: string;
   *   intermediateResultsUrl?: string;
   *   launcher: string;
   *   manifestHash?: string;
   *   manifestUrl?: string;
   *   recordingOracle?: string;
   *   recordingOracleFee?: string;
   *   reputationOracle?: string;
   *   reputationOracleFee?: string;
   *   exchangeOracle?: string;
   *   exchangeOracleFee?: string;
   *   status: EscrowStatus;
   *   token: string;
   *   totalFundedAmount: string;
   *   createdAt: string;
   * };
   * ```
   *
   *
   * @param {IEscrowsFilter} filter Filter parameters.
   * @returns {EscrowData[]} List of escrows that match the filter.
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
   *   networks: [ChainId.POLYGON_AMOY]
   * };
   * const escrowDatas = await EscrowUtils.getEscrows(filters);
   * ```
   */
  public static async getEscrows(
    filter: IEscrowsFilter
  ): Promise<EscrowData[]> {
    if (!filter?.networks?.length) {
      throw ErrorUnsupportedChainID;
    }
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

    try {
      const escrowAddresses: EscrowData[] = [];
      for (const chainId of filter.networks) {
        const networkData = NETWORKS[chainId];

        if (!networkData) {
          throw ErrorUnsupportedChainID;
        }

        const { escrows } = await gqlFetch<{ escrows: EscrowData[] }>(
          networkData.subgraphUrl,
          GET_ESCROWS_QUERY(filter),
          {
            ...filter,
            launcher: filter.launcher?.toLowerCase(),
            reputationOracle: filter.reputationOracle?.toLowerCase(),
            recordingOracle: filter.recordingOracle?.toLowerCase(),
            exchangeOracle: filter.exchangeOracle?.toLowerCase(),
            status:
              filter.status !== undefined
                ? Object.entries(EscrowStatus).find(
                    ([, value]) => value === filter.status
                  )?.[0]
                : undefined,
            from: filter.from ? +filter.from.getTime() / 1000 : undefined,
            to: filter.to ? +filter.to.getTime() / 1000 : undefined,
          }
        );
        escrows.map((escrow) => (escrow.chainId = networkData.chainId));
        escrowAddresses.push(...escrows);
      }
      escrowAddresses.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      return escrowAddresses;
    } catch (e: any) {
      return throwError(e);
    }
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
   *   RINKEBY = 4,
   *   GOERLI = 5,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_MUMBAI = 80001,
   *   POLYGON_AMOY = 80002,
   *   MOONBEAM = 1284,
   *   MOONBASE_ALPHA = 1287,
   *   AVALANCHE = 43114,
   *   AVALANCHE_TESTNET = 43113,
   *   CELO = 42220,
   *   CELO_ALFAJORES = 44787,
   *   SKALE = 1273227453,
   *   LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * type EscrowData = {
   *   id: string;
   *   address: string;
   *   amountPaid: string;
   *   balance: string;
   *   count: string;
   *   jobRequesterId: string;
   *   factoryAddress: string;
   *   finalResultsUrl?: string;
   *   intermediateResultsUrl?: string;
   *   launcher: string;
   *   manifestHash?: string;
   *   manifestUrl?: string;
   *   recordingOracle?: string;
   *   recordingOracleFee?: string;
   *   reputationOracle?: string;
   *   reputationOracleFee?: string;
   *   exchangeOracle?: string;
   *   exchangeOracleFee?: string;
   *   status: EscrowStatus;
   *   token: string;
   *   totalFundedAmount: string;
   *   createdAt: string;
   * };
   * ```
   *
   *
   * @param {ChainId} chainId Network in which the escrow has been deployed
   * @param {string} escrowAddress Address of the escrow
   * @returns {EscrowData} Escrow data
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
   *
   * const escrowData = new EscrowUtils.getEscrow(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
   * ```
   */
  public static async getEscrow(
    chainId: ChainId,
    escrowAddress: string
  ): Promise<EscrowData> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (escrowAddress && !ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    try {
      const { escrow } = await gqlFetch<{ escrow: EscrowData }>(
        networkData.subgraphUrl,
        GET_ESCROW_BY_ADDRESS_QUERY(),
        { escrowAddress: escrowAddress.toLowerCase() }
      );

      return escrow || null;
    } catch (e: any) {
      return throwError(e);
    }
  }
}
