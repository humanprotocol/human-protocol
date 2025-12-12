import { TransactionLike } from 'ethers';

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
   * Escrow is finished.
   */
  Complete,
  /**
   * Escrow is cancelled.
   */
  Cancelled,
  /**
   * Escrow is cancelled.
   */
  ToCancel,
}

/**
 * Network data
 */
export type NetworkData = {
  /**
   * Network chain id
   */
  chainId: number;
  /**
   * Network title
   */
  title: string;
  /**
   * Network scanner URL
   */
  scanUrl: string;
  /**
   * HMT Token contract address
   */
  hmtAddress: string;
  /**
   * Escrow Factory contract address
   */
  factoryAddress: string;
  /**
   * Staking contract address
   */
  stakingAddress: string;
  /**
   * KVStore contract address
   */
  kvstoreAddress: string;
  /**
   * Subgraph URL
   */
  subgraphUrl: string;
  /**
   * Subgraph URL API key
   */
  subgraphUrlApiKey: string;
  /**
   * Old subgraph URL
   */
  oldSubgraphUrl: string;
  /**
   * Old Escrow Factory contract address
   */
  oldFactoryAddress: string;
};

export type TransactionLikeWithNonce = TransactionLike & { nonce: number };
