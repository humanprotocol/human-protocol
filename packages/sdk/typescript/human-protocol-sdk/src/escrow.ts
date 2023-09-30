/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from '@ethersproject/abstract-provider';
import { Network } from '@ethersproject/networks';
import {
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { BigNumber, ContractReceipt, Signer, ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { DEFAULT_TX_ID, NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId } from './enums';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
  ErrorProviderDoesNotExist,
  ErrorUnsupportedChainID,
  ErrorInvalidAddress,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidRecordingOracleAddressProvided,
  ErrorInvalidReputationOracleAddressProvided,
  ErrorInvalidTokenAddress,
  ErrorInvalidUrl,
  ErrorLaunchedEventIsNotEmitted,
  ErrorListOfHandlersCannotBeEmpty,
  ErrorRecipientAndAmountsMustBeSameLength,
  ErrorRecipientCannotBeEmptyArray,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorUrlIsEmptyString,
  InvalidEthereumAddressError,
  ErrorInvalidExchangeOracleAddressProvided,
} from './error';
import { IEscrowConfig, IEscrowsFilter } from './interfaces';
import { EscrowStatus, NetworkData } from './types';
import { isValidUrl, throwError } from './utils';
import {
  EscrowData,
  GET_ESCROWS_QUERY,
  GET_ESCROW_BY_ADDRESS_QUERY,
} from './graphql';

export class EscrowClient {
  private escrowFactoryContract: EscrowFactory;
  private escrowContract?: Escrow;
  private signerOrProvider: Signer | Provider;
  public network: NetworkData;

  /**
   * **EscrowClient constructor**
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the Escrow contract
   */
  constructor(signerOrProvider: Signer | Provider, network: NetworkData) {
    this.escrowFactoryContract = EscrowFactory__factory.connect(
      network.factoryAddress,
      signerOrProvider
    );
    this.network = network;
    this.signerOrProvider = signerOrProvider;
  }

  /**
   * Creates an instance of EscrowClient from a Signer or Provider.
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @returns {Promise<EscrowClient>} - An instance of EscrowClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(signerOrProvider: Signer | Provider) {
    let network: Network;
    if (Signer.isSigner(signerOrProvider)) {
      if (!signerOrProvider.provider) {
        throw ErrorProviderDoesNotExist;
      }

      network = await signerOrProvider.provider.getNetwork();
    } else {
      network = await signerOrProvider.getNetwork();
    }

    const chainId: ChainId = network.chainId;
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new EscrowClient(signerOrProvider, networkData);
  }

  /**
   * Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.
   *
   * @param {string} tokenAddress - Token address to use for pay outs.
   * @param {string[]} trustedHandlers - Array of addresses that can perform actions on the contract.
   * @returns {Promise<string>} - Return the address of the escrow created.
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  public async createEscrow(
    tokenAddress: string,
    trustedHandlers: string[],
    jobRequesterId: string
  ): Promise<string> {
    if (!ethers.utils.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.utils.isAddress(trustedHandler)) {
        throw new InvalidEthereumAddressError(trustedHandler);
      }
    });

    try {
      const result: ContractReceipt = await (
        await this.escrowFactoryContract.createEscrow(
          tokenAddress,
          trustedHandlers,
          jobRequesterId
        )
      ).wait();

      const event = result.events?.find(({ topics }) =>
        topics.includes(ethers.utils.id('LaunchedV2(address,address,string)'))
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
   * Sets up the parameters of the escrow.
   *
   * @param {string} escrowAddress - Address of the escrow to set up.
   * @param {IEscrowConfig} escrowConfig - Configuration object with escrow settings.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async setup(
    escrowAddress: string,
    escrowConfig: IEscrowConfig
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

    if (!ethers.utils.isAddress(recordingOracle)) {
      throw ErrorInvalidRecordingOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(reputationOracle)) {
      throw ErrorInvalidReputationOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(exchangeOracle)) {
      throw ErrorInvalidExchangeOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (
      recordingOracleFee.lte(0) ||
      reputationOracleFee.lte(0) ||
      exchangeOracleFee.lte(0)
    ) {
      throw ErrorAmountMustBeGreaterThanZero;
    }

    if (
      recordingOracleFee.add(reputationOracleFee).add(exchangeOracleFee).gt(100)
    ) {
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
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.setup(
        reputationOracle,
        recordingOracle,
        exchangeOracle,
        reputationOracleFee,
        recordingOracleFee,
        exchangeOracleFee,
        manifestUrl,
        manifestHash
      );

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * **Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.*
   * **Sets up the parameters of the escrow.*
   *
   * @param {string} tokenAddress - Token address to use for pay outs.
   * @param {string[]} trustedHandlers - Array of addresses that can perform actions on the contract.
   * @param {IEscrowConfig} escrowConfig - Configuration object with escrow settings.
   * @returns {Promise<string>}
   * @throws {Error} - An error object if an error occurred.
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
   * **Adds funds of the chosen token to the escrow.*
   *
   * @param {string} escrowAddress - Address of the escrow to fund.
   * @param {BigNumber} amount - Amount to be added as funds.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async fund(escrowAddress: string, amount: BigNumber): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (amount.lte(0)) {
      throw ErrorAmountMustBeGreaterThanZero;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );

      const tokenAddress = await this.escrowContract.token();

      const tokenContract: HMToken = HMToken__factory.connect(
        tokenAddress,
        this.signerOrProvider
      );

      await tokenContract.transfer(escrowAddress, amount);

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * **Stores the results.*
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @param {string} sender - Address of the sender.
   * @param {string} url - Results file url.
   * @param {string} hash - Results file hash.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async storeResults(
    escrowAddress: string,
    url: string,
    hash: string
  ): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
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
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.storeResults(url, hash);

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * **Sets the status of an escrow to completed.*
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async complete(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.complete();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Pays out the amounts specified to the workers and sets the URL of the final results file.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @param {string[]} recipients - Array of recipient addresses.
   * @param {BigNumber[]} amounts - Array of amounts the recipients will receive.
   * @param {string} finalResultsUrl - Final results file url.
   * @param {string} finalResultsHash - Final results file hash.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: BigNumber[],
    finalResultsUrl: string,
    finalResultsHash: string
  ): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
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
      if (!ethers.utils.isAddress(recipient)) {
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

    let totalAmount = BigNumber.from(0);
    amounts.forEach((amount) => {
      totalAmount = totalAmount.add(amount);
    });

    if (balance.lt(totalAmount)) {
      throw ErrorEscrowDoesNotHaveEnoughBalance;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );

      await this.escrowContract.bulkPayOut(
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Cancels the specified escrow and sends the balance to the canceler.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async cancel(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      const tx = await this.escrowContract.cancel();
      const { transactionHash } = await tx.wait();

      return transactionHash;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Cancels the specified escrow, sends the balance to the canceler and selfdestructs the escrow contract.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async abort(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.abort();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Adds an array of addresses to the trusted handlers list.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @param {string[]} trustedHandlers - List of trusted handler addresses.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async addTrustedHandlers(
    escrowAddress: string,
    trustedHandlers: string[]
  ): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (trustedHandlers.length === 0) {
      throw ErrorListOfHandlersCannotBeEmpty;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.utils.isAddress(trustedHandler)) {
        throw new InvalidEthereumAddressError(trustedHandler);
      }
    });

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.addTrustedHandlers(trustedHandlers);
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the balance for a specified escrow address.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<BigNumber>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getBalance(escrowAddress: string): Promise<BigNumber> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.getBalance();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the manifest file hash.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getManifestHash(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.manifestHash();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the manifest file URL.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getManifestUrl(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.manifestUrl();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the results file URL.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getResultsUrl(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.finalResultsUrl();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the intermediate results file URL.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getIntermediateResultsUrl(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.intermediateResultsUrl();
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the value for a specified key and address
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getTokenAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.token();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the current status of the escrow.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getStatus(escrowAddress: string): Promise<EscrowStatus> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.status();
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Returns the recording oracle address of given escrow
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>} - Address of the recording oracle.
   * @throws {Error} - An error object if an error occurred.
   */
  async getRecordingOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.recordingOracle();
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the job launcher address of given escrow
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>} - Address of the job launcher.
   * @throws {Error} - An error object if an error occurred.
   */
  async getJobLauncherAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.launcher();
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the reputation oracle address of given escrow
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>} - Address of the reputation oracle.
   * @throws {Error} - An error object if an error occurred.
   */
  async getReputationOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.reputationOracle();
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the reputation oracle address of given escrow
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>} - Address of the reputation oracle.
   * @throws {Error} - An error object if an error occurred.
   */
  async getExchangeOracleAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.exchangeOracle();
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the escrow factory address of given escrow
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<string>} - Address of the escrow factory.
   * @throws {Error} - An error object if an error occurred.
   */
  async getFactoryAddress(escrowAddress: string): Promise<string> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      return this.escrowContract.escrowFactory();
    } catch (e: any) {
      return throwError(e);
    }
  }
}

export class EscrowUtils {
  /**
   * Returns the list of escrows for given filter
   *
   * @param {IEscrowsFilter} filter - Filter parameters.
   * @returns {Promise<EscrowData[]>}
   * @throws {Error} - An error object if an error occurred.
   */
  public static async getEscrows(
    filter: IEscrowsFilter
  ): Promise<EscrowData[]> {
    if (!filter?.networks?.length) {
      throw ErrorUnsupportedChainID;
    }
    if (filter.launcher && !ethers.utils.isAddress(filter.launcher)) {
      throw ErrorInvalidAddress;
    }

    if (
      filter.recordingOracle &&
      !ethers.utils.isAddress(filter.recordingOracle)
    ) {
      throw ErrorInvalidAddress;
    }

    if (
      filter.reputationOracle &&
      !ethers.utils.isAddress(filter.reputationOracle)
    ) {
      throw ErrorInvalidAddress;
    }

    if (
      filter.exchangeOracle &&
      !ethers.utils.isAddress(filter.exchangeOracle)
    ) {
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
            status: filter.status
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
   * Returns the escrow for a given address
   *
   * @param {string} escrowAddress - Escrow address.
   * @param {ChainId} chainId - Chain id.
   * @returns {Promise<EscrowData>}
   * @throws {Error} - An error object if an error occurred.
   */
  public static async getEscrow(
    chainId: ChainId,
    escrowAddress: string
  ): Promise<EscrowData> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (escrowAddress && !ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    try {
      const { escrow } = await gqlFetch<{ escrow: EscrowData }>(
        networkData.subgraphUrl,
        GET_ESCROW_BY_ADDRESS_QUERY(),
        { escrowAddress }
      );

      return escrow || null;
    } catch (e: any) {
      return throwError(e);
    }
  }
}
