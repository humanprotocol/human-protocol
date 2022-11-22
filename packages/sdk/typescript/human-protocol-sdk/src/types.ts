import {
  Escrow,
  EscrowFactory,
  HMToken,
} from '@human-protocol/core/typechain-types';
import { ethers } from 'ethers';

/**********************************
 *          Types for Job         *
 **********************************/

/**
 * Enum for escrow statuses.
 * @readonly
 * @enum {number}
 */
export enum EscrowStatus {
  /**
   * Escrow is launched.
   */
  Launched,
  /**
   * Escrow is funded, and waiting for the results to be submitted.
   */
  Pending,
  /**
   * Escrow is partially paid out.
   */
  Partial,
  /**
   * Escrow is fully paid.
   */
  Paid,
  /**
   * Escrow is finished..
   */
  Complete,
  /**
   * Escrow is cancelled.
   */
  Cancelled,
}

/**
 * Payout item
 * @readonly
 */
export type Payout = {
  /**
   * Payout address
   */
  address: string;
  /**
   * Payout amount
   */
  amount: number;
};

/**
 * Manifest item
 * @readonly
 * @todo Confirm data type
 */
export type Manifest = {
  /**
   * Bid price for the task
   */
  task_bid_price: number;
  /**
   * Total tasks in the job
   */
  job_total_tasks: number;

  /**
   * Staking amount for oracles
   */
  oracle_stake: number;
  /**
   * Reputation oracle address
   */
  reputation_oracle_addr: string;
  /**
   * Recording oracle address
   */
  recording_oracle_addr: string;
};

/**
 * Cloud storage object link
 * @readonly
 */
export type StorageObjectLink = {
  /**
   * Storage object URL
   */
  url: string;
  /**
   * Storage object content hash
   */
  hash: string;
};

/**
 * Ethers provider data
 * @readonly
 */
export type ProviderData = {
  /**
   * Ethers provider
   */
  provider: ethers.providers.BaseProvider;
  /**
   * Gas payer wallet
   */
  gasPayer?: ethers.Wallet;
  /**
   * Reputation oracle wallet
   */
  reputationOracle?: ethers.Wallet;
  /**
   * Other trusted handlers for the job
   */
  trustedHandlers: Array<ethers.Wallet>;
};

/**
 * AWS/GCP cloud storage access data
 * @readonly
 */
export type StorageAccessData = {
  /**
   * Access Key ID
   */
  accessKeyId: string;
  /**
   * Secret Access Key
   */
  secretAccessKey: string;
  /**
   * Region
   */
  region?: string;
  /**
   * Request endpoint
   */
  endpoint?: string;
  /**
   * Storage bucket (private)
   */
  bucket: string;
  /**
   * Storage bucket (public)
   */
  publicBucket: string;
};

/**
 * Manifest data
 */
export type ManifestData = {
  /**
   * Manifest
   */
  manifest?: Manifest;
  /**
   * Manifest link
   */
  manifestlink?: StorageObjectLink;
  /**
   * Intermediate result link
   */
  intermediateResultLink?: StorageObjectLink;
};

/**
 * Contract data
 */
export type ContractData = {
  /**
   * Factory contract address
   */
  factoryAddr?: string;
  /**
   * Factory contract instance
   */
  factory?: EscrowFactory;
  /**
   * Escrow contract address
   */
  escrowAddr?: string;
  /**
   * Escrow contract instance
   */
  escrow?: Escrow;
  /**
   * HMToken contract address
   */
  hmTokenAddr: string;
  /**
   * HMToken contract instance
   */
  hmToken?: HMToken;
};

/**
 * Generic result data
 * @readonly
 */
export type Result = Record<string, string | number>;

/**
 * Upload result data
 * @readonly
 */
export type UploadResult = {
  /**
   * Uploaded object key
   */
  key: string;
  /**
   * Hash of uploaded object key
   */
  hash: string;
};
