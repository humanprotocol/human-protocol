import { ethers } from 'ethers';
import { NETWORKS } from './constants';
import { ChainId, OrderDirection } from './enums';
import { ErrorInvalidAddress, ErrorUnsupportedChainID } from './error';
import { WorkerData } from './graphql';
import { GET_WORKER_QUERY, GET_WORKERS_QUERY } from './graphql/queries/worker';
import { IWorker, IWorkersFilter, SubgraphOptions } from './interfaces';
import { getSubgraphUrl, customGqlFetch } from './utils';

/**
 * Utility class for worker-related operations.
 *
 * @example
 * ```ts
 * import { WorkerUtils, ChainId } from '@human-protocol/sdk';
 *
 * const worker = await WorkerUtils.getWorker(
 *   ChainId.POLYGON_AMOY,
 *   '0x1234567890abcdef1234567890abcdef12345678'
 * );
 * console.log('Worker:', worker);
 * ```
 */
export class WorkerUtils {
  /**
   * This function returns the worker data for the given address.
   *
   * @param chainId - The chain ID.
   * @param address - The worker address.
   * @param options - Optional configuration for subgraph requests.
   * @returns Returns the worker details or null if not found.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidAddress If the address is invalid
   *
   * @example
   * ```ts
   * import { WorkerUtils, ChainId } from '@human-protocol/sdk';
   *
   * const worker = await WorkerUtils.getWorker(
   *   ChainId.POLYGON_AMOY,
   *   '0x1234567890abcdef1234567890abcdef12345678'
   * );
   * console.log('Worker:', worker);
   * ```
   */
  public static async getWorker(
    chainId: ChainId,
    address: string,
    options?: SubgraphOptions
  ): Promise<IWorker | null> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidAddress;
    }

    const { worker } = await customGqlFetch<{
      worker: WorkerData | null;
    }>(
      getSubgraphUrl(networkData),
      GET_WORKER_QUERY,
      {
        address: address.toLowerCase(),
      },
      options
    );

    if (!worker) return null;

    return mapWorker(worker);
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
   *   totalHMTAmountReceived: bigint;
   *   payoutCount: number;
   * };
   * ```
   *
   * @param filter - Filter for the workers.
   * @param options - Optional configuration for subgraph requests.
   * @returns Returns an array with all the worker details.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidAddress If the filter address is invalid
   *
   * @example
   * ```ts
   * import { WorkerUtils, ChainId } from '@human-protocol/sdk';
   *
   * const filter = {
   *   chainId: ChainId.POLYGON_AMOY,
   *   first: 10,
   *   skip: 0,
   * };
   * const workers = await WorkerUtils.getWorkers(filter);
   * console.log('Workers:', workers.length);
   * ```
   */
  public static async getWorkers(
    filter: IWorkersFilter,
    options?: SubgraphOptions
  ): Promise<IWorker[]> {
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

    const { workers } = await customGqlFetch<{
      workers: WorkerData[];
    }>(
      getSubgraphUrl(networkData),
      GET_WORKERS_QUERY(filter),
      {
        address: filter?.address?.toLowerCase(),
        first: first,
        skip: skip,
        orderBy: orderBy,
        orderDirection: orderDirection,
      },
      options
    );

    if (!workers) {
      return [];
    }

    return workers.map((w) => mapWorker(w));
  }
}

function mapWorker(w: WorkerData): IWorker {
  return {
    id: w.id,
    address: w.address,
    totalHMTAmountReceived: BigInt(w.totalHMTAmountReceived || 0),
    payoutCount: Number(w.payoutCount || 0),
  };
}
