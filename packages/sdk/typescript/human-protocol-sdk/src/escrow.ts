import {
  HMToken__factory,
  HMToken,
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
} from '@human-protocol/core/typechain-types';
import { BigNumber, Signer, ethers } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorFeeMustBeBetweenZeroAndHundred,
  ErrorHashIsEmptyString,
  ErrorInvalidAddress,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidRecordingOracleAddressProvided,
  ErrorInvalidReputationOracleAddressProvided,
  ErrorInvalidTokenAddress,
  ErrorInvalidUrl,
  ErrorListOfHandlersCannotBeEmpty,
  ErrorManifestFileDoesNotExist,
  ErrorRecipientAndAmountsMustBeSameLength,
  ErrorRecipientCannotBeEmptyArray,
  ErrorSigner,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorUrlIsEmptyString,
} from './error';
import {
  IClientParams,
  IEscrowConfig,
  IEscrowsFilter,
  ILauncherEscrowsResult,
} from './interfaces';
import { gqlFetch, throwError } from './utils';
import { DEFAULT_TX_ID } from './constants';
import {
  RAW_LAUNCHED_ESCROWS_FILTERED_QUERY,
  RAW_LAUNCHED_ESCROWS_QUERY,
} from './queries';
import { EscrowStatus, NetworkData } from './types';

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
  public async createEscrow(
    tokenAddress: string,
    trustedHandlers: string[]
  ): Promise<string> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(tokenAddress)) {
      throw ErrorInvalidTokenAddress;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.utils.isAddress(trustedHandler)) {
        throw ErrorInvalidAddress;
      }
    });

    try {
      await this.escrowFactoryContract.createEscrow(
        tokenAddress,
        trustedHandlers
      );

      return this.escrowFactoryContract.lastEscrow();
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

    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(recordingOracle)) {
      throw ErrorInvalidRecordingOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(reputationOracle)) {
      throw ErrorInvalidReputationOracleAddressProvided;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    if (
      recordingOracleFee.lt(0) ||
      recordingOracleFee.eq(0) ||
      recordingOracleFee.gt(100) ||
      reputationOracleFee.lt(0) ||
      reputationOracleFee.eq(0) ||
      reputationOracleFee.gt(100)
    ) {
      throw ErrorFeeMustBeBetweenZeroAndHundred;
    }

    if (recordingOracleFee.add(reputationOracleFee).gt(100)) {
      throw ErrorTotalFeeMustBeLessThanHundred;
    }

    if (!manifestUrl) {
      throw ErrorUrlIsEmptyString;
    }

    if (!hash) {
      throw ErrorHashIsEmptyString;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.setup(
        recordingOracle,
        reputationOracle,
        recordingOracleFee,
        reputationOracleFee,
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
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async createAndSetupEscrow(
    tokenAddress: string,
    trustedHandlers: string[],
    escrowConfig: IEscrowConfig
  ): Promise<void> {
    try {
      const escrowAddress = await this.createEscrow(
        tokenAddress,
        trustedHandlers
      );

      await this.setup(escrowAddress, escrowConfig);

      return;
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
  async fund(escrowAddress: string, amount: BigNumber): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    if (amount.lt(0) || amount.eq(0)) {
      throw ErrorAmountMustBeGreaterThanZero;
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
  async storeResults(
    escrowAddress: string,
    sender: string,
    url: string,
    hash: string
  ): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(sender)) {
      throw ErrorInvalidAddress;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    if (!url) {
      throw ErrorUrlIsEmptyString;
    }

    if (!hash) {
      throw ErrorHashIsEmptyString;
    }

    try {
      this.escrowContract = Escrow__factory.connect(
        escrowAddress,
        this.signerOrProvider
      );
      await this.escrowContract.storeResults(sender, url, hash);

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
  async complete(escrowAddress: string): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

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
  async bulkPayOut(
    escrowAddress: string,
    recipients: string[],
    amounts: BigNumber[],
    finalResultsUrl: string,
    finalResultsHash: string
  ): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
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
        throw ErrorInvalidAddress;
      }
    });

    if (!finalResultsUrl) {
      throw ErrorUrlIsEmptyString;
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
  async cancel(escrowAddress: string): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

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
  async abort(escrowAddress: string): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

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
  async addTrustedHandlers(
    escrowAddress: string,
    trustedHandlers: string[]
  ): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    if (trustedHandlers.length === 0) {
      throw ErrorListOfHandlersCannotBeEmpty;
    }

    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.utils.isAddress(trustedHandler)) {
        throw ErrorInvalidAddress;
      }
    });

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
   * Returns the current status of the escrow.
   *
   * @param {IEscrowsFilter} requesterAddress - Address of the requester.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getLaunchedEscrows(
    requesterAddress: string
  ): Promise<ILauncherEscrowsResult[]> {
    if (!ethers.utils.isAddress(requesterAddress)) {
      throw ErrorInvalidAddress;
    }

    try {
      const { data } = await gqlFetch(
        this.network.subgraphUrl,
        RAW_LAUNCHED_ESCROWS_QUERY(),
        {
          address: requesterAddress,
        }
      );

      return data;
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the escrows addresses created by a job requester.
   *
   * @param {string} escrowAddress - Address of the escrow.
   * @param {IEscrowsFilter} filer - Filter parameters.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getEscrowsFiltered(
    escrowAddress: string,
    filter: IEscrowsFilter
  ): Promise<ILauncherEscrowsResult[]> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const { data } = await gqlFetch(
        this.network.subgraphUrl,
        RAW_LAUNCHED_ESCROWS_FILTERED_QUERY(),
        {
          address: filter.address,
          status: filter.status,
          from: filter.from,
          tro: filter.to,
        }
      );

      return data;
    } catch (e: any) {
      return throwError(e);
    }
  }
}
