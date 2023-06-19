/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HMToken__factory,
  HMToken,
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
} from '@human-protocol/core/typechain-types';
import { BigNumber, ContractReceipt, Signer, ethers } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
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
} from './error';
import { IClientParams, IEscrowConfig, IEscrowsFilter } from './interfaces';
import { gqlFetch, isValidUrl, throwError } from './utils';
import { DEFAULT_TX_ID } from './constants';
import {
  RAW_LAUNCHED_ESCROWS_FILTERED_QUERY,
  RAW_LAUNCHED_ESCROWS_QUERY,
} from './queries';
import { EscrowStatus, NetworkData } from './types';
import { requiresSigner } from './decorators';

export default class EscrowClient {
  private escrowFactoryContract: EscrowFactory;
  private escrowContract?: Escrow;
  private signerOrProvider: Signer | Provider;
  public network: NetworkData;

  /**
   * **Escrow constructor**
   *
   *   * @param {IClientParams} clientParams - Init client parameters
   */
  constructor(readonly clientParams: IClientParams) {
    this.network = clientParams.network;

    this.escrowFactoryContract = EscrowFactory__factory.connect(
      clientParams.network.factoryAddress,
      clientParams.signerOrProvider
    );
    this.signerOrProvider = clientParams.signerOrProvider;
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
    trustedHandlers: string[]
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
          trustedHandlers
        )
      ).wait();

      const event = result.events?.find(({ topics }) =>
        topics.includes(ethers.utils.id('Launched(address,address)'))
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
      recordingOracleFee,
      reputationOracleFee,
      manifestUrl,
      hash,
    } = escrowConfig;

    if (!ethers.utils.isAddress(recordingOracle)) {
      throw ErrorInvalidRecordingOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(reputationOracle)) {
      throw ErrorInvalidReputationOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (recordingOracleFee.lte(0) || reputationOracleFee.lte(0)) {
      throw ErrorAmountMustBeGreaterThanZero;
    }

    if (recordingOracleFee.add(reputationOracleFee).gt(100)) {
      throw ErrorTotalFeeMustBeLessThanHundred;
    }

    if (!manifestUrl) {
      throw ErrorUrlIsEmptyString;
    }

    if (!isValidUrl(manifestUrl)) {
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
      await this.escrowContract.setup(
        reputationOracle,
        recordingOracle,
        reputationOracleFee,
        recordingOracleFee,
        manifestUrl,
        hash
      );

      return;
    } catch (e: any) {
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
    escrowConfig: IEscrowConfig
  ): Promise<string> {
    try {
      const escrowAddress = await this.createEscrow(
        tokenAddress,
        trustedHandlers
      );

      await this.setup(escrowAddress, escrowConfig);

      return escrowAddress;
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Cancels the specified escrow and sends the balance to the canceler.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  @requiresSigner
  async cancel(escrowAddress: string): Promise<void> {
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
      await this.escrowContract.cancel();
      return;
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the escrow addresses created by a job requester.
   *
   * @param {IEscrowsFilter} requesterAddress - Address of the requester.
   * @returns {Promise<string[]>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getLaunchedEscrows(requesterAddress: string): Promise<string[]> {
    if (!ethers.utils.isAddress(requesterAddress)) {
      throw ErrorInvalidAddress;
    }

    try {
      const { data } = await gqlFetch(
        this.network.subgraphUrl,
        RAW_LAUNCHED_ESCROWS_QUERY(requesterAddress)
      );

      return data.data.launchedEscrows.map((escrow: any) => escrow.id);
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the escrow addresses based on a specified filter.
   *
   * @param {IEscrowsFilter} filter - Filter parameters.
   * @returns {Promise<string[]>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getEscrowsFiltered(filter: IEscrowsFilter): Promise<string[]> {
    if (filter?.address && !ethers.utils.isAddress(filter?.address)) {
      throw ErrorInvalidAddress;
    }

    try {
      const { data } = await gqlFetch(
        this.network.subgraphUrl,
        RAW_LAUNCHED_ESCROWS_FILTERED_QUERY(
          filter.address,
          filter.status,
          filter.from,
          filter.to
        )
      );

      return data.data.launchedEscrows.map((escrow: any) => escrow.id);
    } catch (e: any) {
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
}
