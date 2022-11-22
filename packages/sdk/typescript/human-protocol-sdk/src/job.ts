import { BigNumber, ContractTransaction, ethers } from 'ethers';

import {
  Escrow,
  EscrowFactory,
  HMToken,
} from '@human-protocol/core/typechain-types';

import { download, getKeyFromURL, getPublicURL, upload } from './storage';
import { EscrowStatus, Manifest, Payout, Result, UploadResult } from './types';
import {
  deployEscrowFactory,
  getEscrow,
  getEscrowFactory,
  getHmToken,
  toFullDigit,
} from './utils';
import { ErrorJobNotLaunched, ErrorReputationOracleMissing } from './error';

/**
 * @class Human Protocol Job
 */
class Job {
  provider: ethers.providers.BaseProvider;
  gasPayer?: ethers.Wallet;
  reputationOracle?: ethers.Wallet;
  trustedHandlers: Array<ethers.Wallet>;

  manifest?: Manifest;
  manifestURL?: string;
  manifestHash?: string;
  intermediateManifestURL?: string;
  intermediateManifestHash?: string;

  factoryAddr?: string;
  escrowAddr?: string;
  hmTokenAddr: string;

  factory?: EscrowFactory;
  escrow?: Escrow;
  hmToken?: HMToken;

  get perJobCost(): number {
    return this.manifest?.task_bid_price || 0;
  }

  get numberOfAnswers(): number {
    return this.manifest?.job_total_tasks || 0;
  }

  get amount(): number {
    return this.perJobCost * this.numberOfAnswers;
  }

  /**
   * Job Arguments
   * @typedef {Object} JobArguments
   * @property {string | undefined} network - Network to run job
   * @property {string | undefined} infuraKey - Infura project ID
   * @property {string | undefined} alchemyKey - Alchemy API Token
   * @property {string | undefined } privateKey - Private key for job runner wallet
   * @property {ethers.Wallet | undefined} signer - Job operator signer
   * @property {string} hmTokenAddr - Address of HMToken
   * @property {string | undefined} factoryAddr - Address of EscrowFactory contract
   * @property {string | undefined} escrowAddr - Address of Escrow contract
   * @property {Manifest | undefined} manifest - Job Manifest
   */
  /**
   * Job constructor
   *
   * If the network is not specified, it'll connect to http://localhost:8545.
   * If the network other than hardhat is specified, either of Infura/Alchemy key is required to connect.
   * @param {JobArguments} args - Job arguments
   */
  constructor({
    network,
    alchemyKey,
    infuraKey,
    gasPayer,
    gasPayerPrivateKey,
    reputationOracle,
    reputationOraclePrivateKey,
    trustedHandlers,
    hmTokenAddr,
    factoryAddr,
    escrowAddr,
    manifest,
  }: {
    network?: string;
    infuraKey?: string;
    alchemyKey?: string;
    gasPayer?: ethers.Wallet;
    gasPayerPrivateKey: string;
    reputationOracle?: ethers.Wallet;
    reputationOraclePrivateKey?: string;
    trustedHandlers?: Array<ethers.Wallet | string>;
    hmTokenAddr: string;
    factoryAddr?: string;
    escrowAddr?: string;
    manifest?: Manifest;
  }) {
    this.provider = network
      ? ethers.getDefaultProvider(network, {
          alchemy: alchemyKey,
          infura: infuraKey,
        })
      : new ethers.providers.JsonRpcProvider();

    if (gasPayer) {
      this.gasPayer = gasPayer;
    } else if (gasPayerPrivateKey) {
      this.gasPayer = new ethers.Wallet(gasPayerPrivateKey, this.provider);
    }

    if (reputationOracle) {
      this.reputationOracle = reputationOracle;
    } else if (reputationOraclePrivateKey) {
      this.reputationOracle = new ethers.Wallet(
        reputationOraclePrivateKey,
        this.provider
      );
    }

    this.trustedHandlers =
      trustedHandlers?.map((trustedHandler) => {
        if (typeof trustedHandler === 'string') {
          return new ethers.Wallet(trustedHandler, this.provider);
        }
        return trustedHandler;
      }) || [];

    this.hmTokenAddr = hmTokenAddr;
    this.escrowAddr = escrowAddr;
    this.factoryAddr = factoryAddr;
    this.manifest = manifest;

    this._initialize();
  }

  async launch(): Promise<boolean> {
    if (this.escrow) {
      throw new Error('Job is already launched');
    }

    if (!this.manifest) {
      throw new Error('Manifest is required');
    }

    if (!this.reputationOracle) {
      throw new Error('Reputation Oracle is required');
    }

    const txReceipt = await this.factory?.createEscrow(
      this.trustedHandlers?.map((trustedHandler) => trustedHandler.address) ||
        []
    );

    const txResponse = await txReceipt?.wait();

    const event = txResponse?.events?.find(
      (event) => event.event === 'Launched'
    );

    const escrowAddr = event?.args?.[1];
    console.log(`Escrow is deployed at ${escrowAddr}`);

    this.escrowAddr = escrowAddr;
    this.escrow = await getEscrow(escrowAddr, this.gasPayer);

    const { key, hash } = await this._upload(this.manifest);

    this.manifestURL = key;
    this.manifestHash = hash;

    return (
      (await this.status()) == EscrowStatus.Launched &&
      (await this.balance())?.toNumber() === 0
    );
  }

  async setup(senderAddr?: string): Promise<boolean> {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    if (!this.hmToken) {
      throw new Error('HMToken is not defined');
    }

    const reputationOracleStake = (this.manifest?.oracle_stake || 0) * 100;
    const recordingOracleStake = (this.manifest?.oracle_stake || 0) * 100;
    const repuationOracleAddr = this.manifest?.reputation_oracle_addr || '';
    const recordingOracleAddr = this.manifest?.recording_oracle_addr || '';

    const transferred = await (senderAddr
      ? this._raffleExecute(
          this.hmToken.transferFrom,
          senderAddr,
          this.escrow.address,
          toFullDigit(this.amount)
        )
      : this._raffleExecute(
          this.hmToken?.transfer,
          this.escrow.address,
          toFullDigit(this.amount)
        ));

    if (!transferred) {
      throw new Error(
        'Failed to transfer HMT with all credentials, not continuing to setup'
      );
    }

    const contractSetup = await this._raffleExecute(
      this.escrow.setup,
      repuationOracleAddr,
      recordingOracleAddr,
      reputationOracleStake,
      recordingOracleStake
    );

    if (!contractSetup) {
      throw new Error('Failed to setup contract');
    }

    return (
      (await this.status()) === EscrowStatus.Pending &&
      (await this.balance())?.toString() === toFullDigit(this.amount).toString()
    );
  }

  async addTrustedHandlers(handlers: string[]): Promise<boolean> {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const result = await this._raffleExecute(
      this.escrow.addTrustedHandlers,
      handlers
    );

    if (!result) {
      throw new Error('Failed to add trusted handlers to the job');
    }

    return result;
  }

  async bulkPayout(
    payouts: Payout[],
    result: Record<string, string | number>,
    encrypt = true,
    isPublic = false
  ): Promise<boolean> {
    if (!this.reputationOracle) {
      throw new Error('Reputation oracle is missing');
    }

    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const { key, hash } = await this._upload(result, encrypt, isPublic);

    const url = isPublic ? getPublicURL(key) : key;

    const bulkPaid = await this._raffleExecute(
      this.escrow.bulkPayOut,
      payouts.map(({ address }) => address),
      payouts.map(({ amount }) => toFullDigit(amount)),
      url,
      hash,
      1
    );

    if (!bulkPaid) {
      throw new Error('Failed to bulk payout users');
    }

    return bulkPaid;
  }

  async abort(): Promise<boolean> {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const aborted = await this._raffleExecute(this.escrow.abort);

    if (!aborted) {
      throw new Error('Failed to abort the job');
    }

    return aborted;
  }

  async cancel(): Promise<boolean> {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const cancelled = await this._raffleExecute(this.escrow.cancel);

    if (!cancelled) {
      throw new Error('Failed to cancel the job');
    }

    return (await this.status()) === EscrowStatus.Cancelled;
  }

  async storeIntermediateResults(result: Result): Promise<boolean> {
    if (!this.reputationOracle) {
      throw new Error('Reputation oracle is missing');
    }

    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const { key, hash } = await this._upload(result);

    const resultStored = await this._raffleExecute(
      this.escrow.storeResults,
      key,
      hash
    );

    if (!resultStored) {
      throw new Error('Failed to store results');
    }

    this.intermediateManifestURL = key;
    this.intermediateManifestHash = hash;

    return resultStored;
  }

  async complete() {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const completed = await this._raffleExecute(this.escrow.complete);

    if (!completed) {
      throw new Error('Failed to complete the job');
    }

    return (await this.status()) === EscrowStatus.Complete;
  }

  async status(): Promise<EscrowStatus> {
    return (await this.escrow?.status()) as EscrowStatus;
  }

  async balance(): Promise<BigNumber | undefined> {
    return await this.escrow?.getBalance();
  }

  async intermediateResults(): Promise<Result | undefined> {
    return this._download(this.intermediateManifestURL);
  }

  async finalResults(): Promise<Result | undefined> {
    if (!this.escrow) {
      throw ErrorJobNotLaunched;
    }

    const finalResultsURL = await this.escrow?.finalResultsUrl();

    if (!finalResultsURL) {
      return undefined;
    }

    const key = getKeyFromURL(finalResultsURL);

    return await this._download(key);
  }

  /**
   * Initialize the job
   * For existing jobs, access the job on-chain, and read manifest
   * For new jobs, deploy escrow factory to launch escrows
   */
  private async _initialize() {
    this.hmToken = await getHmToken(this.hmTokenAddr);

    if (!this.escrowAddr) {
      if (!this.manifest) {
        throw new Error('Manifest is required for new escrow');
      }

      this.factory = await deployEscrowFactory(this.hmTokenAddr, this.gasPayer);
    } else {
      if (!this.factoryAddr) {
        throw new Error('Factory address is required for existing escrow');
      }

      this.factory = await getEscrowFactory(this.factoryAddr, this.gasPayer);

      const hasEscrow = await this.factory.hasEscrow(this.escrowAddr);

      if (!hasEscrow) {
        throw new Error('Factory does not contain the escrow');
      }

      this.escrow = await getEscrow(this.escrowAddr, this.gasPayer);

      this.manifestURL = await this.escrow.manifestUrl();
      this.manifestHash = await this.escrow.manifestHash();

      this.manifest = (await this._download(this.manifestURL)) as Manifest;
    }
  }

  private async _download(url?: string): Promise<Result | undefined> {
    if (!url || !this.reputationOracle) {
      return undefined;
    }

    return await download(url, this.reputationOracle.privateKey);
  }

  private async _upload(
    result: Result,
    encrypt = false,
    isPublic = false
  ): Promise<UploadResult> {
    if (!this.reputationOracle) {
      throw ErrorReputationOracleMissing;
    }

    return await upload(
      result,
      this.reputationOracle?.publicKey,
      encrypt,
      isPublic
    );
  }

  private async _raffleExecute(
    txn: (...args: any) => Promise<ContractTransaction>,
    ...args: any
  ) {
    try {
      await txn(...args);
      return true;
    } catch (err) {
      console.log(err);
    }

    for (const trustedHandler of this.trustedHandlers) {
      try {
        await txn(...args, { from: trustedHandler });
        return true;
      } catch (err) {
        console.log(err);
      }
    }
    return false;
  }
}

export default Job;
