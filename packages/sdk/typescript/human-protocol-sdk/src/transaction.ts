/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { NETWORKS } from './constants';
import { ChainId } from './enums';
import {
  ErrorCannotUseDateAndBlockSimultaneously,
  ErrorInvalidHahsProvided,
  ErrorUnsupportedChainID,
} from './error';
import {
  GET_TRANSACTIONS_QUERY,
  GET_TRANSACTION_QUERY,
} from './graphql/queries/transaction';
import { ITransaction, ITransactionsFilter } from './interfaces';
import { getSubgraphUrl } from './utils';

export class TransactionUtils {
  /**
   * This function returns the transaction data for the given hash.
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
      throw ErrorInvalidHahsProvided;
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

    return transaction;
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
   *   networks: ChainId[]; // List of chain IDs to query.
   *   fromAddress?: string; // (Optional) The address from which transactions are sent.
   *   toAddress?: string; // (Optional) The address to which transactions are sent.
   *   startDate?: Date; // (Optional) The start date to filter transactions (inclusive).
   *   endDate?: Date; // (Optional) The end date to filter transactions (inclusive).
   *   startBlock?: number; // (Optional) The start block number to filter transactions (inclusive).
   *   endBlock?: number; // (Optional) The end block number to filter transactions (inclusive).
   * }
   * ```
   *
   * ```ts
   * type ITransaction = {
   *   block: number;
   *   txHash: string;
   *   from: string;
   *   to: string;
   *   timestamp: number;
   *   value: string;
   *   method: string;
   * };
   * ```
   *
   * @param {ITransactionsFilter} filter Filter for the transactions.
   * @returns {Promise<ITransaction[]>} Returns an array with all the transaction details.
   *
   * **Code example**
   *
   * ```ts
   * import { TransactionUtils, ChainId } from '@human-protocol/sdk';
   *
   * const filter: ITransactionsFilter = {
   *   networks: [ChainId.POLYGON],
   *   startDate: new Date('2022-01-01'),
   *   endDate: new Date('2022-12-31')
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

    const transactions_data: ITransaction[] = [];
    for (const chainId of filter.networks) {
      const networkData = NETWORKS[chainId];
      if (!networkData) {
        throw ErrorUnsupportedChainID;
      }
      const { transactions } = await gqlFetch<{
        transactions: ITransaction[];
      }>(getSubgraphUrl(networkData), GET_TRANSACTIONS_QUERY(filter), {
        fromAddress: filter?.fromAddress,
        toAddress: filter?.toAddress,
        startDate: filter?.startDate
          ? Math.floor(filter?.startDate.getTime() / 1000)
          : undefined,
        endDate: filter.endDate
          ? Math.floor(filter.endDate.getTime() / 1000)
          : undefined,
        startBlock: filter.startBlock ? filter.startBlock : undefined,
        endBlock: filter.endBlock ? filter.endBlock : undefined,
      });

      if (!transactions) {
        continue;
      }

      transactions_data.push(...transactions);
    }
    return transactions_data;
  }
}
