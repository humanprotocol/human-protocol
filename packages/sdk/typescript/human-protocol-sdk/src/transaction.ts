import { ethers } from 'ethers';
import { NETWORKS } from './constants';
import { ChainId, OrderDirection } from './enums';
import {
  ErrorCannotUseDateAndBlockSimultaneously,
  ErrorInvalidHashProvided,
  ErrorUnsupportedChainID,
} from './error';
import { TransactionData } from './graphql';
import {
  GET_TRANSACTION_QUERY,
  GET_TRANSACTIONS_QUERY,
} from './graphql/queries/transaction';
import {
  InternalTransaction,
  ITransaction,
  ITransactionsFilter,
  SubgraphOptions,
} from './interfaces';
import { getSubgraphUrl, getUnixTimestamp, customGqlFetch } from './utils';

/**
 * Utility class for transaction-related queries.
 *
 * @example
 * ```ts
 * import { TransactionUtils, ChainId } from '@human-protocol/sdk';
 *
 * const transaction = await TransactionUtils.getTransaction(
 *   ChainId.POLYGON_AMOY,
 *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
 * );
 * console.log('Transaction:', transaction);
 * ```
 */
export class TransactionUtils {
  /**
   * This function returns the transaction data for the given hash.
   *
   * ```ts
   * type ITransaction = {
   *   block: bigint;
   *   txHash: string;
   *   from: string;
   *   to: string;
   *   timestamp: bigint;
   *   value: bigint;
   *   method: string;
   *   receiver?: string;
   *   escrow?: string;
   *   token?: string;
   *   internalTransactions: InternalTransaction[];
   * };
   * ```
   *
   * ```ts
   * type InternalTransaction = {
   *  from: string;
   *  to: string;
   *  value: bigint;
   *  method: string;
   *  receiver?: string;
   *  escrow?: string;
   *  token?: string;
   * };
   * ```
   *
   * @param chainId - The chain ID.
   * @param hash - The transaction hash.
   * @param options - Optional configuration for subgraph requests.
   * @returns Returns the transaction details or null if not found.
   * @throws ErrorInvalidHashProvided If the hash is invalid
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   *
   * @example
   * ```ts
   * import { TransactionUtils, ChainId } from '@human-protocol/sdk';
   *
   * const transaction = await TransactionUtils.getTransaction(
   *   ChainId.POLYGON_AMOY,
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
   * );
   * console.log('Transaction:', transaction);
   * ```
   */
  public static async getTransaction(
    chainId: ChainId,
    hash: string,
    options?: SubgraphOptions
  ): Promise<ITransaction | null> {
    if (!ethers.isHexString(hash)) {
      throw ErrorInvalidHashProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { transaction } = await customGqlFetch<{
      transaction: TransactionData | null;
    }>(
      getSubgraphUrl(networkData),
      GET_TRANSACTION_QUERY,
      {
        hash: hash.toLowerCase(),
      },
      options
    );
    if (!transaction) return null;

    return mapTransaction(transaction);
  }

  /**
   * This function returns all transaction details based on the provided filter.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * interface ITransactionsFilter {
   *   chainId: ChainId; // List of chain IDs to query.
   *   fromAddress?: string; // (Optional) The address from which transactions are sent.
   *   toAddress?: string; // (Optional) The address to which transactions are sent.
   *   method?: string; // (Optional) The method of the transaction to filter by.
   *   escrow?: string; // (Optional) The escrow address to filter transactions.
   *   token?: string; // (Optional) The token address to filter transactions.
   *   startDate?: Date; // (Optional) The start date to filter transactions (inclusive).
   *   endDate?: Date; // (Optional) The end date to filter transactions (inclusive).
   *   startBlock?: bigint | number; // (Optional) The start block to filter transactions (inclusive).
   *   endBlock?: bigint | number; // (Optional) The end block to filter transactions (inclusive).
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is DESC.
   * }
   * ```
   *
   * ```ts
   * type InternalTransaction = {
   *  from: string;
   *  to: string;
   *  value: bigint;
   *  method: string;
   *  receiver?: string;
   *  escrow?: string;
   *  token?: string;
   * };
   * ```
   *
   * ```ts
   * type ITransaction = {
   *   block: bigint;
   *   txHash: string;
   *   from: string;
   *   to: string;
   *   timestamp: bigint;
   *   value: bigint;
   *   method: string;
   *   receiver?: string;
   *   escrow?: string;
   *   token?: string;
   *   internalTransactions: InternalTransaction[];
   * };
   * ```
   *
   * @param filter - Filter for the transactions.
   * @param options - Optional configuration for subgraph requests.
   * @returns Returns an array with all the transaction details.
   * @throws ErrorCannotUseDateAndBlockSimultaneously If both date and block filters are used
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   *
   * @example
   * ```ts
   * import { TransactionUtils, ChainId, OrderDirection } from '@human-protocol/sdk';
   *
   * const filter = {
   *   chainId: ChainId.POLYGON_AMOY,
   *   startDate: new Date('2022-01-01'),
   *   endDate: new Date('2022-12-31'),
   *   first: 10,
   *   skip: 0,
   *   orderDirection: OrderDirection.DESC,
   * };
   * const transactions = await TransactionUtils.getTransactions(filter);
   * console.log('Transactions:', transactions.length);
   * ```
   */
  public static async getTransactions(
    filter: ITransactionsFilter,
    options?: SubgraphOptions
  ): Promise<ITransaction[]> {
    if (
      (!!filter.startDate || !!filter.endDate) &&
      (!!filter.startBlock || !!filter.endBlock)
    ) {
      throw ErrorCannotUseDateAndBlockSimultaneously;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { transactions } = await customGqlFetch<{
      transactions: TransactionData[];
    }>(
      getSubgraphUrl(networkData),
      GET_TRANSACTIONS_QUERY(filter),
      {
        fromAddress: filter?.fromAddress,
        toAddress: filter?.toAddress,
        startDate: filter?.startDate
          ? getUnixTimestamp(filter?.startDate)
          : undefined,
        endDate: filter.endDate ? getUnixTimestamp(filter.endDate) : undefined,
        startBlock: filter.startBlock ? Number(filter.startBlock) : undefined,
        endBlock: filter.endBlock ? Number(filter.endBlock) : undefined,
        method: filter.method ? filter.method : undefined,
        escrow: filter.escrow ? filter.escrow : undefined,
        token: filter.token ? filter.token : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      },
      options
    );

    if (!transactions) {
      return [];
    }

    return transactions.map((transaction) => mapTransaction(transaction));
  }
}

function mapTransaction(t: TransactionData): ITransaction {
  const internalTransactions: InternalTransaction[] = (
    t.internalTransactions || []
  ).map((itx) => ({
    from: itx.from,
    to: itx.to,
    value: BigInt(itx.value),
    method: itx.method,
    receiver: itx.receiver,
    escrow: itx.escrow,
    token: itx.token,
  }));

  return {
    block: BigInt(t.block),
    txHash: t.txHash,
    from: t.from,
    to: t.to,
    timestamp: Number(t.timestamp) * 1000,
    value: BigInt(t.value),
    method: t.method,
    receiver: t.receiver,
    escrow: t.escrow,
    token: t.token,
    internalTransactions,
  };
}
