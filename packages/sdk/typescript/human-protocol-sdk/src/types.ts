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
 * AWS/GCP cloud storage access data
 * @readonly
 * @deprecated StorageClient is deprecated. Use Minio.Client directly.
 */
export type StorageCredentials = {
  /**
   * Access Key
   */
  accessKey: string;
  /**
   * Secret Key
   */
  secretKey: string;
};

/**
 * @deprecated StorageClient is deprecated. Use Minio.Client directly.
 */
export type StorageParams = {
  /**
   * Request endPoint
   */
  endPoint: string;
  /**
   * Enable secure (HTTPS) access. Default value set to false
   */
  useSSL: boolean;
  /**
   * Region
   */
  region?: string;
  /**
   * TCP/IP port number. Default value set to 80 for HTTP and 443 for HTTPs
   */
  port?: number;
};

/**
 * Upload file data
 * @readonly
 */
export type UploadFile = {
  /**
   * Uploaded object key
   */
  key: string;
  /**
   * Uploaded object URL
   */
  url: string;
  /**
   * Hash of uploaded object key
   */
  hash: string;
};

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

/**
 * Represents the response data for an escrow withdrawal.
 */
export type EscrowWithdraw = {
  /**
   * The hash of the transaction associated with the escrow withdrawal.
   */
  txHash: string;
  /**
   * The address of the token used for the withdrawal.
   */
  tokenAddress: string;
  /**
   * The amount withdrawn from the escrow.
   */
  amountWithdrawn: bigint;
};

/**
 * Represents a payout from an escrow.
 */
export type Payout = {
  /**
   * Unique identifier of the payout.
   */
  id: string;
  /**
   * The address of the escrow associated with the payout.
   */
  escrowAddress: string;
  /**
   * The address of the recipient who received the payout.
   */
  recipient: string;
  /**
   * The amount paid to the recipient.
   */
  amount: bigint;
  /**
   * The timestamp when the payout was created (in UNIX format).
   */
  createdAt: number;
};

export type TransactionLikeWithNonce = TransactionLike & { nonce: number };

/**
 * Represents a cancellation refund event.
 */
export type CancellationRefund = {
  /**
   * Unique identifier of the cancellation refund event.
   */
  id: string;
  /**
   * The address of the escrow associated with the cancellation refund.
   */
  escrowAddress: string;
  /**
   * The address of the receiver who received the refund.
   */
  receiver: string;
  /**
   * The amount refunded to the receiver.
   */
  amount: bigint;
  /**
   * The block number in which the cancellation refund event occurred.
   */

  block: number;
  /**
   * The timestamp when the cancellation refund event occurred (in UNIX format).
   */
  timestamp: number;
  /**
   * The transaction hash of the cancellation refund event.
   */
  txHash: string;
};
