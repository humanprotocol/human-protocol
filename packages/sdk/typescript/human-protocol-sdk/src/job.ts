import { BigNumber, Contract, ethers } from 'ethers';
import winston from 'winston';

import {
  DEFAULT_PUBLIC_BUCKET,
  DEFAULT_ENDPOINT,
  DEFAULT_PORT,
  DEFAULT_USE_SSL,
} from './constants';
import StorageClient from './storage';
import {
  EscrowStatus,
  Manifest,
  Payout,
  ProviderData,
  Result,
  UploadResult,
  ManifestData,
  ContractData,
  JobArguments,
  StorageCredentials,
  StorageParams,
} from './types';
import {
  deployEscrowFactory,
  getEscrow,
  getEscrowFactory,
  getHmToken,
  getStaking,
  toFullDigit,
} from './utils';
import {
  ErrorHMTokenMissing,
  ErrorJobAlreadyLaunched,
  ErrorJobNotInitialized,
  ErrorJobNotLaunched,
  ErrorManifestMissing,
  ErrorReputationOracleMissing,
  ErrorStakingMissing,
  ErrorStorageBucketNotFound,
  ErrorStorageClientNotExists,
} from './error';
import { createLogger } from './logger';

/**
 * @class Human Protocol Job
 */
export class Job {
  /**
   * Ethers provider data
   */
  providerData?: ProviderData;

  /**
   * Job manifest & result data
   */
  manifestData?: ManifestData;

  /**
   * Job smart contract data
   */
  contractData?: ContractData;

  /**
   * Cloud storage client
   */
  storageClient?: StorageClient;

  /**
   * Cloud storage bucket name
   */
  storageBucket?: string;

  private _logger: winston.Logger;

  /**
   * Get the total cost of the job
   * @return {number} The total cost of the job
   */
  get amount(): number {
    return (
      (this.manifestData?.manifest?.task_bid_price || 0) *
      (this.manifestData?.manifest?.job_total_tasks || 0)
    );
  }

  /**
   * **Job constructor**
   *
   * If the network is not specified, it'll connect to http://localhost:8545.
   * If the network other than hardhat is specified, either of Infura/Alchemy key is required to connect.
   *
   * @param {JobArguments} args - Job arguments
   */
  constructor({
    network,
    alchemyKey,
    infuraKey,
    gasPayer,
    reputationOracle,
    trustedHandlers,
    hmTokenAddr,
    factoryAddr,
    escrowAddr,
    manifest,
    storageAccessKey,
    storageSecretKey,
    storageEndpoint,
    storagePort,
    storageUseSSL,
    storageBucket,
    stakingAddr,
    logLevel = 'info',
  }: JobArguments) {
    const provider = network
      ? ethers.getDefaultProvider(network, {
          alchemy: alchemyKey,
          infura: infuraKey,
        })
      : new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

    this.providerData = {
      provider,
    };

    if (typeof gasPayer === 'string') {
      this.providerData.gasPayer = new ethers.Wallet(gasPayer, provider);
    } else {
      this.providerData.gasPayer = gasPayer;
    }

    if (typeof reputationOracle === 'string') {
      this.providerData.reputationOracle = new ethers.Wallet(
        reputationOracle,
        provider
      );
    } else {
      this.providerData.reputationOracle = reputationOracle;
    }

    this.providerData.trustedHandlers =
      trustedHandlers?.map((trustedHandler) => {
        if (typeof trustedHandler === 'string') {
          return new ethers.Wallet(trustedHandler, provider);
        }
        return trustedHandler;
      }) || [];

    this.contractData = {
      hmTokenAddr,
      escrowAddr,
      factoryAddr,
      stakingAddr,
    };

    this.manifestData = { manifest };

    const storageCredentials: StorageCredentials = {
      accessKey: storageAccessKey || '',
      secretKey: storageSecretKey || '',
    };

    const storageParams: StorageParams = {
      endPoint: storageEndpoint || DEFAULT_ENDPOINT,
      port: storagePort || DEFAULT_PORT,
      useSSL: storageUseSSL || DEFAULT_USE_SSL,
    };

    this.storageClient = new StorageClient(storageCredentials, storageParams);

    this.storageBucket = storageBucket || DEFAULT_PUBLIC_BUCKET;

    this._logger = createLogger(logLevel);
  }

  /**
   * **Initialize the escrow**
   *
   * For existing escrows, access the escrow on-chain, and read manifest.
   * For new escrows, deploy escrow factory to launch new escrow.
   *
   * @returns {Promise<boolean>} - True if escrow is initialized successfully.
   */
  async initialize(): Promise<boolean> {
    if (!this.contractData) {
      this._logError(new Error('Contract data is missing'));
      return false;
    }

    this.contractData.hmToken = await getHmToken(
      this.contractData.hmTokenAddr,
      this.providerData?.gasPayer
    );

    if (!this.contractData?.escrowAddr) {
      if (!this.manifestData?.manifest) {
        this._logError(ErrorManifestMissing);
        return false;
      }

      if (!this.contractData.stakingAddr) {
        this._logError(new Error('Staking contract is missing'));
        return false;
      }

      this._logger.info('Getting staking...');
      this.contractData.staking = await getStaking(
        this.contractData.stakingAddr,
        this.providerData?.gasPayer
      );

      this._logger.info('Deploying escrow factory...');
      this.contractData.factory = await deployEscrowFactory(
        this.contractData.stakingAddr,
        this.providerData?.gasPayer
      );
      this.contractData.factoryAddr = this.contractData.factory.address;
      this._logger.info(
        `Escrow factory is deployed at ${this.contractData.factory.address}.`
      );
    } else {
      if (!this.contractData?.factoryAddr) {
        this._logError(
          new Error('Factory address is required for existing escrow')
        );
        return false;
      }

      this._logger.info('Getting escrow factory...');
      this.contractData.factory = await getEscrowFactory(
        this.contractData?.factoryAddr,
        this.providerData?.gasPayer
      );

      this._logger.info('Checking if staking is configured...');
      const stakingAddr = await this.contractData.factory.staking();
      if (!stakingAddr) {
        this._logError(new Error('Factory is not configured with staking'));
        this.contractData.factory = undefined;

        return false;
      }
      this._logger.info('Getting staking...');
      this.contractData.staking = await getStaking(
        stakingAddr,
        this.providerData?.gasPayer
      );
      this.contractData.stakingAddr = stakingAddr;

      this._logger.info('Checking if reward pool is configured...');
      const rewardPoolAddr = await this.contractData.staking.rewardPool();
      if (!rewardPoolAddr) {
        this._logError(new Error('Staking is not configured with reward pool'));
        this.contractData.staking = undefined;
        this.contractData.factory = undefined;

        return false;
      }

      this._logger.info('Checking if escrow exists in the factory...');
      const hasEscrow = await this.contractData?.factory.hasEscrow(
        this.contractData?.escrowAddr
      );

      if (!hasEscrow) {
        this._logError(new Error('Factory does not contain the escrow'));
        this.contractData.factory = undefined;

        return false;
      }

      this._logger.info('Accessing the escrow...');
      this.contractData.escrow = await getEscrow(
        this.contractData?.escrowAddr,
        this.providerData?.gasPayer
      );
      this._logger.info('Accessed the escrow successfully.');

      const manifestUrl = await this.contractData?.escrow.manifestUrl();
      const manifestHash = await this.contractData?.escrow.manifestHash();

      if (
        (!manifestUrl.length || !manifestHash.length) &&
        !this.manifestData?.manifest
      ) {
        this._logError(ErrorManifestMissing);

        this.contractData.factory = undefined;
        this.contractData.escrow = undefined;

        return false;
      }

      if (manifestUrl.length && manifestHash.length) {
        this.manifestData = {
          ...this.manifestData,
          manifestlink: {
            url: manifestUrl,
            hash: manifestHash,
          },
        };

        if (!this.storageBucket) {
          this._logError(ErrorStorageBucketNotFound);
          return false;
        }

        this.manifestData.manifest = (await this._download(
          manifestUrl,
          this.storageBucket
        )) as Manifest;
      }
    }

    return true;
  }

  /**
   * **Launch the escrow**
   *
   * Deploy new escrow contract, and uploads manifest.
   *
   * @returns {Promise<boolean>} - True if the escrow is launched successfully.
   */
  async launch(): Promise<boolean> {
    if (!this.contractData || !this.contractData.factory) {
      this._logError(ErrorJobNotInitialized);
      return false;
    }

    if (!this.contractData || this.contractData.escrow) {
      this._logError(ErrorJobAlreadyLaunched);
      return false;
    }

    if (!this.providerData || !this.providerData.reputationOracle) {
      this._logError(ErrorReputationOracleMissing);
      return false;
    }

    this._logger.info('Launching escrow...');

    try {
      const txReceipt = await this.contractData?.factory?.createEscrow(
        this.contractData.hmTokenAddr,
        this.providerData?.trustedHandlers?.map(
          (trustedHandler) => trustedHandler.address
        ) || []
      );

      const txResponse = await txReceipt?.wait();

      const event = txResponse?.events?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: any) => event.event === 'Launched'
      );

      const escrowAddr = event?.args?.[1];
      this._logger.info(`Escrow is deployed at ${escrowAddr}.`);

      this.contractData.escrowAddr = escrowAddr;
      this.contractData.escrow = await getEscrow(
        escrowAddr,
        this.providerData?.gasPayer
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this._logError(new Error('Error creating escrow... ' + e.message));
      return false;
    }

    return (
      (await this.status()) == EscrowStatus.Launched &&
      (await this.balance())?.toNumber() === 0
    );
  }

  /**
   * Setup escrow
   *
   * Sets the escrow contract to be ready to receive answers from the Recording Oracle.
   *
   * @param {string | undefined} senderAddr - Address of HMToken sender
   * @returns {Promise<boolean>} True if the escrow is setup successfully.
   */
  async setup(senderAddr?: string): Promise<boolean> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    if (!this.manifestData || !this.manifestData.manifest) {
      this._logError(ErrorManifestMissing);
      return false;
    }

    if (this.manifestData.manifestlink) {
      this._logError(new Error('Job is already setup'));
      return false;
    }

    if (!this.contractData.hmToken) {
      this._logError(ErrorHMTokenMissing);
      return false;
    }

    const reputationOracleFeePercentage =
      (this.manifestData?.manifest?.oracle_stake || 0) * 100;
    const recordingOracleFeePercentage =
      (this.manifestData?.manifest?.oracle_stake || 0) * 100;
    const repuationOracleAddr =
      this.manifestData?.manifest?.reputation_oracle_addr || '';
    const recordingOracleAddr =
      this.manifestData?.manifest?.recording_oracle_addr || '';

    this._logger.info(
      `Transferring ${this.amount} HMT to ${this.contractData.escrow.address}...`
    );
    const transferred = await (senderAddr
      ? this._raffleExecute(
          this.contractData.hmToken,
          'transferFrom',
          senderAddr,
          this.contractData.escrow.address,
          toFullDigit(this.amount)
        )
      : this._raffleExecute(
          this.contractData.hmToken,
          'transfer',
          this.contractData.escrow.address,
          toFullDigit(this.amount)
        ));

    if (!transferred) {
      this._logError(
        new Error(
          'Failed to transfer HMT with all credentials, not continuing to setup'
        )
      );
      return false;
    }
    this._logger.info('HMT transferred.');

    if (!this.storageBucket) {
      this._logError(ErrorStorageBucketNotFound);
      return false;
    }

    this._logger.info('Uploading manifest...');
    const uploadResult = await this._upload(
      this.manifestData.manifest,
      this.storageBucket
    );
    if (!uploadResult) {
      this._logError(new Error('Error uploading manifest'));
      return false;
    }

    this.manifestData.manifestlink = {
      url: uploadResult.key,
      hash: uploadResult.hash,
    };
    this._logger.info(
      `Uploaded manifest.\n\tKey: ${uploadResult.key}\n\tHash: ${uploadResult.hash}`
    );

    this._logger.info('Setting up the escrow...');
    const contractSetup = await this._raffleExecute(
      this.contractData.escrow,
      'setup',
      repuationOracleAddr,
      recordingOracleAddr,
      reputationOracleFeePercentage,
      recordingOracleFeePercentage,
      this.manifestData?.manifestlink?.url,
      this.manifestData?.manifestlink?.hash
    );

    if (!contractSetup) {
      this._logError(new Error('Failed to setup contract'));
      return false;
    }

    this._logger.info('Escrow is set up.');

    return (
      (await this.status()) === EscrowStatus.Pending &&
      (await this.balance())?.toString() === toFullDigit(this.amount).toString()
    );
  }

  /**
   * Add trusted handlers
   *
   * Add trusted handlers that can freely transact with the contract and
   * perform aborts and cancels for example.
   *
   * @param {string[]} handlers - Trusted handlers to add
   * @returns {Promise<boolean>} - True if trusted handlers are added successfully.
   */
  async addTrustedHandlers(handlers: string[]): Promise<boolean> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    const result = await this._raffleExecute(
      this.contractData.escrow,
      'addTrustedHandlers',
      handlers
    );

    if (!result) {
      this._logError(new Error('Failed to add trusted handlers to the job'));
      return false;
    }

    return result;
  }

  /**
   * **Bulk payout**
   *
   * Payout the workers submitting the result.
   *
   * @param {Payout[]} payouts - Workers address & amount to payout
   * @param {Result} result - Job result submitted
   * @param {bool} encrypt - Whether to encrypt the result, or not
   * @param {bool} isPublic - Whether to store data in public storage, or private.
   * @returns {Promise<boolean>} - True if the workers are paid out successfully.
   */
  async bulkPayout(payouts: Payout[], result: Result): Promise<boolean> {
    if (!this.providerData?.reputationOracle) {
      this._logError(ErrorReputationOracleMissing);
      return false;
    }

    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    if (!this.storageBucket) {
      this._logError(ErrorStorageBucketNotFound);
      return false;
    }

    this._logger.info('Uploading result...');
    const uploadResult = await this._upload(result, this.storageBucket);

    if (!uploadResult) {
      this._logError(new Error('Error uploading result'));
      return false;
    }

    const { key, hash } = uploadResult;
    this._logger.info(`Uploaded result.\n\tKey: ${key}\n\tHash: ${hash}`);

    if (!this.storageClient) {
      this._logError(ErrorStorageClientNotExists);
      return false;
    }

    this._logger.info('Bulk paying out the workers...');
    const paid = await this._raffleExecute(
      this.contractData.escrow,
      'bulkPayOut',
      payouts.map(({ address }) => address),
      payouts.map(({ amount }) => toFullDigit(amount)),
      key,
      hash,
      1
    );

    if (!paid) {
      this._logError(new Error('Failed to bulk payout users'));
      return false;
    }

    this._logger.info('Workers are paid out.');

    return true;
  }

  /**
   * **Abort the escrow**
   *
   * @returns {Promise<boolean>} - True if the escrow is aborted successfully.
   */
  async abort(): Promise<boolean> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    this._logger.info('Aborting the job...');
    const aborted = await this._raffleExecute(
      this.contractData.escrow,
      'abort'
    );

    if (!aborted) {
      this._logError(new Error('Failed to abort the job'));
      return false;
    }
    this._logger.info('Job is aborted successfully.');

    return aborted;
  }

  /**
   * **Cancel the escrow**
   *
   * @returns {Promise<boolean>} - True if the escrow is cancelled successfully.
   */
  async cancel(): Promise<boolean> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    this._logger.info('Cancelling the job...');
    const cancelled = await this._raffleExecute(
      this.contractData.escrow,
      'cancel'
    );

    if (!cancelled) {
      this._logError(new Error('Failed to cancel the job'));
      return false;
    }
    this._logger.info('Job is cancelled successfully.');

    return (await this.status()) === EscrowStatus.Cancelled;
  }

  /**
   * **Store intermediate result**
   *
   * Uploads intermediate result to the storage, and saves the URL/Hash on-chain.
   *
   * @param {Result} result - Intermediate result
   * @param {String} sender - Sender address of the result
   * @returns {Promise<boolean>} - True if the intermediate result is stored successfully.
   */
  async storeIntermediateResults(
    result: Result,
    sender: string
  ): Promise<boolean> {
    if (!this.providerData?.reputationOracle) {
      this._logError(ErrorReputationOracleMissing);
      return false;
    }

    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    if (!this.storageBucket) {
      this._logError(ErrorStorageBucketNotFound);
      return false;
    }

    this._logger.info('Uploading intermediate result...');
    const uploadResult = await this._upload(result, this.storageBucket);

    if (!uploadResult) {
      this._logError(new Error('Error uploading intermediate result'));
      return false;
    }

    const { key, hash } = uploadResult;
    this._logger.info(
      `Uploaded intermediate result.\n\tKey: ${key}\n\tHash: ${hash}`
    );

    this._logger.info('Saving intermediate result on-chain...');
    const resultStored = await this._raffleExecute(
      this.contractData.escrow,
      'storeResults',
      key,
      hash
    );

    if (!resultStored) {
      this._logError(new Error('Failed to store results'));
      return false;
    }
    this._logger.info('Intermediate result is stored on-chain successfully.');

    this.manifestData = {
      ...this.manifestData,
      intermediateResultLink: { url: key, hash },
    };

    return resultStored;
  }

  /**
   * **Complete the escrow**
   *
   * @returns {Promise<boolean>} - True if the escrow if completed successfully.
   */
  async complete() {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    const completed = await this._raffleExecute(
      this.contractData.escrow,
      'complete'
    );

    if (!completed) {
      this._logError(new Error('Failed to complete the job'));
      return false;
    }

    return (await this.status()) === EscrowStatus.Complete;
  }

  /**
   * **Stake HMTokens**
   *
   * @param {number} amount - Amount to stake
   * @param {string | undefined} from - Address to stake
   * @returns {Promise<boolean>} - True if the token is staked
   */
  async stake(amount: number, from?: string) {
    if (!this.contractData?.staking) {
      this._logError(ErrorStakingMissing);
      return false;
    }
    if (!this.contractData.hmToken) {
      this._logError(ErrorHMTokenMissing);
      return false;
    }

    const operator = this._findOperator(from);

    if (!operator) {
      this._logError(new Error('Unknown wallet'));
      return false;
    }

    try {
      const approved = await this.contractData.hmToken
        .connect(operator)
        .approve(this.contractData.staking.address, toFullDigit(amount));

      if (!approved) {
        throw new Error('Not approved');
      }
    } catch {
      this._logError(new Error('Error approving HMTokens for staking'));
      return false;
    }

    try {
      await this.contractData.staking
        .connect(operator)
        .stake(toFullDigit(amount));
    } catch {
      this._logError(new Error(`Error executing transaction from ${from}`));
      return false;
    }
    return true;
  }

  /**
   * **Unstake HMTokens**
   *
   * @param {number} amount - Amount to unstake
   * @param {string | undefined} from - Address to unstake
   * @returns {Promise<boolean>} - True if the token is unstaked
   */
  async unstake(amount: number, from?: string) {
    if (!this.contractData?.staking) {
      this._logError(ErrorStakingMissing);
      return false;
    }

    const operator = this._findOperator(from);

    if (!operator) {
      this._logError(new Error('Unknown wallet'));
      return false;
    }

    try {
      await this.contractData.staking
        .connect(operator)
        .unstake(toFullDigit(amount));
    } catch {
      this._logError(new Error(`Error executing transaction from ${from}`));
      return false;
    }
    return true;
  }

  /**
   * **Withdraw unstaked HMTokens**
   *
   * @param {string | undefined} from - Address to withdraw
   * @returns {Promise<boolean>} - True if the token is withdrawn
   */
  async withdraw(from?: string) {
    if (!this.contractData?.staking) {
      this._logError(ErrorStakingMissing);
      return false;
    }

    const operator = this._findOperator(from);

    if (!operator) {
      this._logError(new Error('Unknown wallet'));
      return false;
    }

    try {
      await this.contractData.staking.connect(operator).withdraw();
    } catch {
      this._logError(new Error(`Error executing transaction from ${from}`));
      return false;
    }
    return true;
  }

  /**
   * **Allocate HMTokens staked to the job**
   *
   * @param {number} amount - Amount to allocate
   * @param {string | undefined} - Address to allocate with
   * @returns {Promise<boolean>} - True if the token is allocated
   */
  async allocate(amount: number, from?: string) {
    if (!this.contractData?.staking) {
      this._logError(ErrorStakingMissing);
      return false;
    }

    if (!this.contractData.escrowAddr) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    const operator = this._findOperator(from);

    if (!operator) {
      this._logError(new Error('Unknown wallet'));
      return false;
    }

    try {
      await this.contractData.staking
        .connect(operator)
        .allocate(this.contractData.escrowAddr, toFullDigit(amount));
    } catch {
      this._logError(new Error(`Error executing transaction from ${from}`));
      return false;
    }
    return true;
  }

  /**
   * **Unallocate HMTokens from the job**
   *
   * @param {string | undefined} - Address to close allocation with
   * @returns {Promise<boolean>} - True if the token is unallocated.
   */
  async closeAllocation(from?: string) {
    if (!this.contractData?.staking) {
      this._logError(ErrorStakingMissing);
      return false;
    }

    if (!this.contractData.escrowAddr) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    const operator = this._findOperator(from);

    if (!operator) {
      this._logError(new Error('Unknown wallet'));
      return false;
    }

    try {
      await this.contractData.staking
        .connect(operator)
        .closeAllocation(this.contractData.escrowAddr);
    } catch {
      this._logError(new Error(`Error executing transaction from ${from}`));
      return false;
    }
    return true;
  }

  /**
   * **Get current status of the escrow**
   *
   * @returns {Promise<EscrowStatus | undefined>} - Status of the escrow
   */
  async status(): Promise<EscrowStatus | undefined> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return undefined;
    }

    return (await this.contractData.escrow.status()) as EscrowStatus;
  }

  /**
   * **Get current balance of the escrow**
   *
   * @returns {Promise<BigNumber | undefined>} - Balance of the escrow
   */
  async balance(): Promise<BigNumber | undefined> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return undefined;
    }

    return await this.contractData.escrow.getBalance();
  }

  /**
   * **Get intermediate result stored**
   *
   * @returns {Promise<Result | undefined>} - Intermediate result
   */
  async intermediateResults(): Promise<Result | undefined> {
    if (!this.manifestData?.intermediateResultLink) {
      this._logError(new Error('Intermediate result is missing.'));
      return undefined;
    }

    if (!this.storageBucket) {
      this._logError(ErrorStorageBucketNotFound);
      return undefined;
    }

    return this._download(
      this.manifestData.intermediateResultLink.url,
      this.storageBucket
    );
  }

  /**
   * **Get final result stored**
   *
   * @returns {Promise<Result | undefined>} - Final result
   */
  async finalResults(): Promise<Result | undefined> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return undefined;
    }

    const finalResultsURL = await this.contractData?.escrow?.finalResultsUrl();

    if (!finalResultsURL) {
      return undefined;
    }

    if (!this.storageBucket) {
      this._logError(ErrorStorageBucketNotFound);
      return undefined;
    }

    return await this._download(finalResultsURL, this.storageBucket);
  }

  /**
   * **Check if handler is trusted**
   *
   * @param {string} handlerAddr Address of the handler
   * @returns {Promise<boolean>} - True if the handler is trusted
   */
  async isTrustedHandler(handlerAddr: string): Promise<boolean> {
    if (!this.contractData?.escrow) {
      this._logError(ErrorJobNotLaunched);
      return false;
    }

    return await this.contractData?.escrow?.areTrustedHandlers(handlerAddr);
  }

  /**
   * **Download result from cloud storage**
   *
   * @param {string} key - Key to download
   * @param {string} bucket - Bucket name
   * @returns {Result | undefined} - Downloaded result
   */
  private async _download(
    url: string,
    bucket: string
  ): Promise<Result | undefined> {
    if (!url || !this.providerData?.reputationOracle) {
      return undefined;
    }

    if (!this.storageClient) {
      this._logError(ErrorStorageClientNotExists);
      return undefined;
    }

    const key = this._getKeyFromURL(url);

    const downloadedFiles = await this.storageClient.downloadFiles(
      [key],
      bucket
    );

    return downloadedFiles[0];
  }

  /**
   * **Uploads result to cloud storage**
   *
   * @param {Result} result - Result to upload
   * @param {string} bucket - Bucket name
   * @returns {Promise<UploadResult | undefined>} - Uploaded result
   */
  private async _upload(
    result: Result,
    bucket: string
  ): Promise<UploadResult | undefined> {
    if (!this.providerData?.reputationOracle) {
      this._logError(ErrorReputationOracleMissing);
      return undefined;
    }

    if (!this.storageClient) {
      this._logError(ErrorStorageClientNotExists);
      return undefined;
    }

    const uploadedFiles = await this.storageClient.uploadFiles(
      [result],
      bucket
    );

    return uploadedFiles[0];
  }

  /**
   * **Raffle executes on-chain call**
   *
   * Try to execute the on-chain call from all possible trusted handlers
   *
   * @param {Function} txn - On-chain call to execute
   * @param {any} args - On-chain call arguments
   * @returns {Promise<boolean>} - True if one of handler succeed to execute the on-chain call
   */
  private async _raffleExecute(
    contract: Contract,
    functionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any
  ): Promise<boolean> {
    try {
      if (this.providerData?.gasPayer) {
        await contract
          .connect(this.providerData.gasPayer)
          .functions[functionName](...args);
        return true;
      }
      this._logger.info(
        'Default gas payer is missing, trying with other trusted handlers...'
      );
    } catch (err) {
      this._logger.info(
        'Error executing the transaction from default gas payer, trying with other trusted handlers...'
      );
    }

    for (const trustedHandler of this.providerData?.trustedHandlers || []) {
      try {
        await contract.connect(trustedHandler).functions[functionName](...args);
        return true;
      } catch (err) {
        this._logError(
          new Error(
            'Error executing the transaction from all of the trusted handlers. Stop continue executing...'
          )
        );
      }
    }
    return false;
  }

  /**
   * **Error log**
   *
   * @param {Error} error - Occured error
   */
  private _logError(error: Error) {
    this._logger.error(error.message);
  }

  /**
   * **Find operator to execute tx**
   *
   * @param {string} addr - Address of the operator
   * @returns {ethers.Wallet | undefined} - Operator wallet
   */
  private _findOperator(addr?: string): ethers.Wallet | undefined {
    return addr
      ? [
          this.providerData?.gasPayer,
          ...(this.providerData?.trustedHandlers || []),
        ].find((account?: ethers.Wallet) => account?.address === addr)
      : this.providerData?.gasPayer;
  }

  /**
   * **Parse object key from URL**
   *
   * @param {string} url - URL to parse
   * @returns {string} - The key of the object
   */
  private _getKeyFromURL(url: string): string {
    if (url.startsWith('https')) {
      // URL is fully qualified URL. Let's split it and try to retrieve key from last part of it.
      const keyParts = url.split('/');
      const key = keyParts[keyParts.length - 1];

      return key;
    }

    // If not fully qualified http URL, the key is the URL
    return url;
  }
}
