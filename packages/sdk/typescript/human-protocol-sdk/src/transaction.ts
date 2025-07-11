/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { NETWORKS } from './constants';
import { ChainId, OrderDirection } from './enums';
import {
  ErrorCannotUseDateAndBlockSimultaneously,
  ErrorInvalidHashProvided,
  ErrorUnsupportedChainID,
} from './error';
import {
  GET_TRANSACTIONS_QUERY,
  GET_TRANSACTION_QUERY,
} from './graphql/queries/transaction';
import { ITransaction, ITransactionsFilter } from './interfaces';
import { getSubgraphUrl, getUnixTimestamp } from './utils';

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
   *   value: string;
   *   method: string;
   *   receiver?: string;
   *   escrow?: string;
   *   token?: string;
   *   internalTransactions: InternalTransaction[];
   * };
   * ```
   *
   * @param {ChainId} chainId The chain ID.
   * @param {string} hash The transaction hash.
   * @returns {Promise<ITransaction>} Returns the transaction details.
   *
   * **Code example**
   *
   * ```ts
   * import { TransactionUtils, ChainId } from '@human-protocol/sdk';
   *
   * const transaction = await TransactionUtils.getTransaction(ChainId.POLYGON, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public static async getTransaction(
    chainId: ChainId,
    hash: string
  ): Promise<ITransaction> {
    if (!ethers.isHexString(hash)) {
      throw ErrorInvalidHashProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { transaction } = await gqlFetch<{
      transaction: ITransaction;
    }>(getSubgraphUrl(networkData), GET_TRANSACTION_QUERY, {
      hash: hash.toLowerCase(),
    });

    return transaction || null;
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
   *   startBlock?: number; // (Optional) The start block number to filter transactions (inclusive).
   *   endBlock?: number; // (Optional) The end block number to filter transactions (inclusive).
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is DESC.
   * }
   * ```
   *
   * ```ts
   * type ITransaction = {
   *   block: bigint;
   *   txHash: string;
   *   from: string;
   *   to: string;
   *   timestamp: bigint;
   *   value: string;
   *   method: string;
   *   receiver?: string;
   *   escrow?: string;
   *   token?: string;
   *   internalTransactions: InternalTransaction[];
   * };
   * ```
   *
   * @param {ITransactionsFilter} filter Filter for the transactions.
   * @returns {Promise<ITransaction[]>} Returns an array with all the transaction details.
   *
   * **Code example**
   *
   * ```ts
   * import { TransactionUtils, ChainId, OrderDirection } from '@human-protocol/sdk';
   *
   * const filter: ITransactionsFilter = {
   *   chainId: ChainId.POLYGON,
   *   startDate: new Date('2022-01-01'),
   *   endDate: new Date('2022-12-31'),
   *   first: 10,
   *   skip: 0,
   *   orderDirection: OrderDirection.DESC,
   * };
   * const transactions = await TransactionUtils.getTransactions(filter);
   * ```
   */
  public static async getTransactions(
    filter: ITransactionsFilter
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

    const { transactions } = await gqlFetch<{
      transactions: ITransaction[];
    }>(getSubgraphUrl(networkData), GET_TRANSACTIONS_QUERY(filter), {
      fromAddress: filter?.fromAddress,
      toAddress: filter?.toAddress,
      startDate: filter?.startDate
        ? getUnixTimestamp(filter?.startDate)
        : undefined,
      endDate: filter.endDate ? getUnixTimestamp(filter.endDate) : undefined,
      startBlock: filter.startBlock ? filter.startBlock : undefined,
      endBlock: filter.endBlock ? filter.endBlock : undefined,
      method: filter.method ? filter.method : undefined,
      escrow: filter.escrow ? filter.escrow : undefined,
      token: filter.token ? filter.token : undefined,
      orderDirection: orderDirection,
      first: first,
      skip: skip,
    });

    if (!transactions) {
      return [];
    }

    return transactions;
  }
}
