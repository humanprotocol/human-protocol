/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderDirection } from '../enums';
import {
  EscrowStatisticsData,
  EventDayData,
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
  GET_HMTOKEN_STATISTICS_QUERY,
  GET_HOLDERS_QUERY,
  HMTHolderData,
  HMTStatisticsData,
} from '../graphql';
import {
  IDailyHMT,
  IEscrowStatistics,
  IHMTHolder,
  IHMTHoldersParams,
  IHMTStatistics,
  IPaymentStatistics,
  IStatisticsFilter,
  IWorkerStatistics,
  SubgraphOptions,
} from '../interfaces';
import { NetworkData } from '../types';
import {
  getSubgraphUrl,
  getUnixTimestamp,
  customGqlFetch,
  throwError,
} from '../utils';

/**
 * Utility class for statistics-related queries.
 *
 * Unlike other SDK clients, `StatisticsUtils` does not require `signer` or `provider` to be provided.
 * We just need to pass the network data to each static method.
 *
 * @example
 * ```ts
 * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
 *
 * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
 * const escrowStats = await StatisticsUtils.getEscrowStatistics(networkData);
 * console.log('Total escrows:', escrowStats.totalEscrows);
 * ```
 */
export class StatisticsUtils {
  /**
   * This function returns the statistical data of escrows.
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsFilter {
   *   from?: Date;
   *   to?: Date;
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
   * }
   * ```
   *
   * ```ts
   * interface IDailyEscrow {
   *   timestamp: number;
   *   escrowsTotal: number;
   *   escrowsPending: number;
   *   escrowsSolved: number;
   *   escrowsPaid: number;
   *   escrowsCancelled: number;
   * };
   *
   * interface IEscrowStatistics {
   *   totalEscrows: number;
   *   dailyEscrowsData: IDailyEscrow[];
   * };
   * ```
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param filter - Statistics params with duration data
   * @param options - Optional configuration for subgraph requests.
   * @returns Escrow statistics data.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const escrowStats = await StatisticsUtils.getEscrowStatistics(networkData);
   * console.log('Total escrows:', escrowStats.totalEscrows);
   *
   * const escrowStatsApril = await StatisticsUtils.getEscrowStatistics(
   *   networkData,
   *   {
   *     from: new Date('2021-04-01'),
   *     to: new Date('2021-04-30'),
   *   }
   * );
   * console.log('April escrows:', escrowStatsApril.totalEscrows);
   * ```
   */
  static async getEscrowStatistics(
    networkData: NetworkData,
    filter: IStatisticsFilter = {},
    options?: SubgraphOptions
  ): Promise<IEscrowStatistics> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { escrowStatistics } = await customGqlFetch<{
        escrowStatistics: EscrowStatisticsData;
      }>(subgraphUrl, GET_ESCROW_STATISTICS_QUERY, options);

      const { eventDayDatas } = await customGqlFetch<{
        eventDayDatas: EventDayData[];
      }>(
        subgraphUrl,
        GET_EVENT_DAY_DATA_QUERY(filter),
        {
          from: filter.from ? getUnixTimestamp(filter.from) : undefined,
          to: filter.to ? getUnixTimestamp(filter.to) : undefined,
          orderDirection: orderDirection,
          first: first,
          skip: skip,
        },
        options
      );

      return {
        totalEscrows: escrowStatistics?.totalEscrowCount
          ? +escrowStatistics.totalEscrowCount
          : 0,
        dailyEscrowsData: eventDayDatas.map((eventDayData) => ({
          timestamp: +eventDayData.timestamp * 1000,
          escrowsTotal: +eventDayData.dailyEscrowCount,
          escrowsPending: +eventDayData.dailyPendingStatusEventCount,
          escrowsSolved: +eventDayData.dailyCompletedStatusEventCount,
          escrowsPaid: +eventDayData.dailyPaidStatusEventCount,
          escrowsCancelled: +eventDayData.dailyCancelledStatusEventCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the statistical data of workers.
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsFilter {
   *   from?: Date;
   *   to?: Date;
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
   * }
   * ```
   *
   * ```ts
   * interface IDailyWorker {
   *   timestamp: number;
   *   activeWorkers: number;
   * };
   *
   * interface IWorkerStatistics {
   *   dailyWorkersData: IDailyWorker[];
   * };
   * ```
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param filter - Statistics params with duration data
   * @param options - Optional configuration for subgraph requests.
   * @returns Worker statistics data.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const workerStats = await StatisticsUtils.getWorkerStatistics(networkData);
   * console.log('Daily workers data:', workerStats.dailyWorkersData);
   *
   * const workerStatsApril = await StatisticsUtils.getWorkerStatistics(
   *   networkData,
   *   {
   *     from: new Date('2021-04-01'),
   *     to: new Date('2021-04-30'),
   *   }
   * );
   * console.log('April workers:', workerStatsApril.dailyWorkersData.length);
   * ```
   */
  static async getWorkerStatistics(
    networkData: NetworkData,
    filter: IStatisticsFilter = {},
    options?: SubgraphOptions
  ): Promise<IWorkerStatistics> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await customGqlFetch<{
        eventDayDatas: EventDayData[];
      }>(
        subgraphUrl,
        GET_EVENT_DAY_DATA_QUERY(filter),
        {
          from: filter.from ? getUnixTimestamp(filter.from) : undefined,
          to: filter.to ? getUnixTimestamp(filter.to) : undefined,
          orderDirection: orderDirection,
          first: first,
          skip: skip,
        },
        options
      );

      return {
        dailyWorkersData: eventDayDatas.map((eventDayData) => ({
          timestamp: +eventDayData.timestamp * 1000,
          activeWorkers: +eventDayData.dailyWorkerCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the statistical data of payments.
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsFilter {
   *   from?: Date;
   *   to?: Date;
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
   * }
   * ```
   *
   * ```ts
   * interface IDailyPayment {
   *   timestamp: number;
   *   totalAmountPaid: bigint;
   *   totalCount: number;
   *   averageAmountPerWorker: bigint;
   * };
   *
   * interface IPaymentStatistics {
   *   dailyPaymentsData: IDailyPayment[];
   * };
   * ```
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param filter - Statistics params with duration data
   * @param options - Optional configuration for subgraph requests.
   * @returns Payment statistics data.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const paymentStats = await StatisticsUtils.getPaymentStatistics(networkData);
   * console.log(
   *   'Payment statistics:',
   *   paymentStats.dailyPaymentsData.map((p) => ({
   *     ...p,
   *     totalAmountPaid: p.totalAmountPaid.toString(),
   *     averageAmountPerWorker: p.averageAmountPerWorker.toString(),
   *   }))
   * );
   *
   * const paymentStatsRange = await StatisticsUtils.getPaymentStatistics(
   *   networkData,
   *   {
   *     from: new Date(2023, 4, 8),
   *     to: new Date(2023, 5, 8),
   *   }
   * );
   * console.log('Payment statistics from 5/8 - 6/8:', paymentStatsRange.dailyPaymentsData.length);
   * ```
   */
  static async getPaymentStatistics(
    networkData: NetworkData,
    filter: IStatisticsFilter = {},
    options?: SubgraphOptions
  ): Promise<IPaymentStatistics> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await customGqlFetch<{
        eventDayDatas: EventDayData[];
      }>(
        subgraphUrl,
        GET_EVENT_DAY_DATA_QUERY(filter),
        {
          from: filter.from ? getUnixTimestamp(filter.from) : undefined,
          to: filter.to ? getUnixTimestamp(filter.to) : undefined,
          orderDirection: orderDirection,
          first: first,
          skip: skip,
        },
        options
      );

      return {
        dailyPaymentsData: eventDayDatas.map((eventDayData) => ({
          timestamp: +eventDayData.timestamp * 1000,
          totalAmountPaid: BigInt(eventDayData.dailyHMTPayoutAmount),
          totalCount: +eventDayData.dailyPayoutCount,
          averageAmountPerWorker:
            eventDayData.dailyWorkerCount === '0'
              ? BigInt(0)
              : BigInt(eventDayData.dailyHMTPayoutAmount) /
                BigInt(eventDayData.dailyWorkerCount),
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the statistical data of HMToken.
   *
   * ```ts
   * interface IHMTStatistics {
   *   totalTransferAmount: bigint;
   *   totalTransferCount: number;
   *   totalHolders: number;
   * };
   * ```
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param options - Optional configuration for subgraph requests.
   * @returns HMToken statistics data.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const hmtStats = await StatisticsUtils.getHMTStatistics(networkData);
   * console.log('HMT statistics:', {
   *   ...hmtStats,
   *   totalTransferAmount: hmtStats.totalTransferAmount.toString(),
   * });
   * ```
   */
  static async getHMTStatistics(
    networkData: NetworkData,
    options?: SubgraphOptions
  ): Promise<IHMTStatistics> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const { hmtokenStatistics } = await customGqlFetch<{
        hmtokenStatistics: HMTStatisticsData;
      }>(subgraphUrl, GET_HMTOKEN_STATISTICS_QUERY, options);

      return {
        totalTransferAmount: BigInt(hmtokenStatistics.totalValueTransfered),
        totalTransferCount: +hmtokenStatistics.totalTransferEventCount,
        totalHolders: +hmtokenStatistics.holders,
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the holders of the HMToken with optional filters and ordering.
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param params - HMT Holders params with filters and ordering
   * @param options - Optional configuration for subgraph requests.
   * @returns List of HMToken holders.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const hmtHolders = await StatisticsUtils.getHMTHolders(networkData, {
   *   orderDirection: 'asc',
   * });
   * console.log('HMT holders:', hmtHolders.map((h) => ({
   *   ...h,
   *   balance: h.balance.toString(),
   * })));
   * ```
   */
  static async getHMTHolders(
    networkData: NetworkData,
    params: IHMTHoldersParams = {},
    options?: SubgraphOptions
  ): Promise<IHMTHolder[]> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const { address, orderDirection } = params;
      const query = GET_HOLDERS_QUERY(address);

      const { holders } = await customGqlFetch<{ holders: HMTHolderData[] }>(
        subgraphUrl,
        query,
        {
          address,
          orderBy: 'balance',
          orderDirection,
        },
        options
      );

      return holders.map((holder) => ({
        address: holder.address,
        balance: BigInt(holder.balance),
      }));
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the statistical data of HMToken day by day.
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsFilter {
   *   from?: Date;
   *   to?: Date;
   *   first?: number; // (Optional) Number of transactions per page. Default is 10.
   *   skip?: number; // (Optional) Number of transactions to skip. Default is 0.
   *   orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
   * }
   * ```
   *
   * ```ts
   * interface IDailyHMT {
   *   timestamp: number;
   *   totalTransactionAmount: bigint;
   *   totalTransactionCount: number;
   *   dailyUniqueSenders: number;
   *   dailyUniqueReceivers: number;
   * }
   * ```
   *
   * @param networkData - The network information required to connect to the subgraph
   * @param filter - Statistics params with duration data
   * @param options - Optional configuration for subgraph requests.
   * @returns Daily HMToken statistics data.
   *
   * @example
   * ```ts
   * import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const networkData = NETWORKS[ChainId.POLYGON_AMOY];
   * const dailyHMTStats = await StatisticsUtils.getHMTDailyData(networkData);
   * console.log('Daily HMT statistics:', dailyHMTStats);
   *
   * const hmtStatsRange = await StatisticsUtils.getHMTDailyData(
   *   networkData,
   *   {
   *     from: new Date(2023, 4, 8),
   *     to: new Date(2023, 5, 8),
   *   }
   * );
   * console.log('HMT statistics from 5/8 - 6/8:', hmtStatsRange.length);
   * ```
   */
  static async getHMTDailyData(
    networkData: NetworkData,
    filter: IStatisticsFilter = {},
    options?: SubgraphOptions
  ): Promise<IDailyHMT[]> {
    try {
      const subgraphUrl = getSubgraphUrl(networkData);
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await customGqlFetch<{
        eventDayDatas: EventDayData[];
      }>(
        subgraphUrl,
        GET_EVENT_DAY_DATA_QUERY(filter),
        {
          from: filter.from ? getUnixTimestamp(filter.from) : undefined,
          to: filter.to ? getUnixTimestamp(filter.to) : undefined,
          orderDirection: orderDirection,
          first: first,
          skip: skip,
        },
        options
      );

      return eventDayDatas.map((eventDayData) => ({
        timestamp: +eventDayData.timestamp * 1000,
        totalTransactionAmount: BigInt(eventDayData.dailyHMTTransferAmount),
        totalTransactionCount: +eventDayData.dailyHMTTransferCount,
        dailyUniqueSenders: +eventDayData.dailyUniqueSenders,
        dailyUniqueReceivers: +eventDayData.dailyUniqueReceivers,
      }));
    } catch (e: any) {
      return throwError(e);
    }
  }
}
