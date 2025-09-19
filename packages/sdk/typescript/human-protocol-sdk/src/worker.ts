import gqlFetch from 'graphql-request';
import { NETWORKS } from './constants';
import { ChainId, OrderDirection } from './enums';
import { ErrorInvalidAddress, ErrorUnsupportedChainID } from './error';
import { GET_WORKER_QUERY, GET_WORKERS_QUERY } from './graphql/queries/worker';
import { IWorker, IWorkersFilter } from './interfaces';
import { getSubgraphUrl } from './utils';
import { ethers } from 'ethers';

export class WorkerUtils {
  /**
   * This function returns the worker data for the given address.
   *
   * @param {ChainId} chainId The chain ID.
   * @param {string} address The worker address.
   * @returns {Promise<IWorker | null>} - Returns the worker details or null if not found.
   *
   * **Code example**
   *
   * ```ts
   * import { WorkerUtils, ChainId } from '@human-protocol/sdk';
   *
   * const worker = await WorkerUtils.getWorker(ChainId.POLYGON, '0x1234567890abcdef1234567890abcdef12345678');
   * ```
   */
  public static async getWorker(
    chainId: ChainId,
    address: string
  ): Promise<IWorker | null> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidAddress;
    }

    const { worker } = await gqlFetch<{
      worker: IWorker;
    }>(getSubgraphUrl(networkData), GET_WORKER_QUERY, {
      address: address.toLowerCase(),
    });

    return worker || null;
  }

  /**
   * This function returns all worker details based on the provided filter.
   *
   * **Input parameters**
   *
   * ```ts
   * interface IWorkersFilter {
   *   chainId: ChainId; // List of chain IDs to query.
   *   address?: string; // (Optional) The worker address to filter by.
   *   orderBy?: string; // (Optional) The field to order by. Default is 'payoutCount'.
   *   orderDirection?: OrderDirection; // (Optional) The direction of the order. Default is 'DESC'.
   *   first?: number; // (Optional) Number of workers per page. Default is 10.
   *   skip?: number; // (Optional) Number of workers to skip. Default is 0.
   * }
   * ```
   *
   * ```ts
   * type IWorker = {
   *   id: string;
   *   address: string;
   *   totalHMTAmountReceived: string;
   *   payoutCount: number;
   * };
   * ```
   *
   * @param {IWorkersFilter} filter Filter for the workers.
   * @returns {Promise<IWorker[]>} Returns an array with all the worker details.
   *
   * **Code example**
   *
   * ```ts
   * import { WorkerUtils, ChainId } from '@human-protocol/sdk';
   *
   * const filter: IWorkersFilter = {
   *   chainId: ChainId.POLYGON,
   *   first: 10,
   *   skip: 0,
   * };
   * const workers = await WorkerUtils.getWorkers(filter);
   * ```
   */
  public static async getWorkers(filter: IWorkersFilter): Promise<IWorker[]> {
    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderBy = filter.orderBy || 'payoutCount';
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    if (filter.address && !ethers.isAddress(filter.address)) {
      throw ErrorInvalidAddress;
    }

    const { workers } = await gqlFetch<{
      workers: IWorker[];
    }>(getSubgraphUrl(networkData), GET_WORKERS_QUERY(filter), {
      address: filter?.address?.toLowerCase(),
      first: first,
      skip: skip,
      orderBy: orderBy,
      orderDirection: orderDirection,
    });

    if (!workers) {
      return [];
    }

    return workers;
  }
}
