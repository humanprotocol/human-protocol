/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';

import {
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
  GET_HOLDERS_QUERY,
  GET_HMTOKEN_STATISTICS_QUERY,
  EscrowStatistics,
  EscrowStatisticsData,
  EventDayData,
  HMTStatistics,
  HMTStatisticsData,
  PaymentStatistics,
  WorkerStatistics,
  HMTHolderData,
  HMTHolder,
  DailyHMTData,
} from './graphql';
import { IHMTHoldersParams, IStatisticsFilter } from './interfaces';
import { NetworkData } from './types';
import { getSubgraphUrl, getUnixTimestamp, throwError } from './utils';
import { OrderDirection } from './enums';

/**
 * ## Introduction
 *
 * This client enables obtaining statistical information from the subgraph.
 *
 * Unlike other SDK clients, `StatisticsClient` does not require `signer` or `provider` to be provided.
 * We just need to create a client object using relevant network data.
 *
 * ```ts
 * constructor(network: NetworkData)
 * ```
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ```ts
 * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
 *
 * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
 * ```
 */
export class StatisticsClient {
  public networkData: NetworkData;
  public subgraphUrl: string;

  /**
   * **StatisticsClient constructor**
   *
   * @param {NetworkData} networkData - The network information required to connect to the Statistics contract
   */
  constructor(networkData: NetworkData) {
    this.networkData = networkData;
    this.subgraphUrl = getSubgraphUrl(networkData);
  }

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
   * type DailyEscrowsData = {
   *   timestamp: Date;
   *   escrowsTotal: number;
   *   escrowsPending: number;
   *   escrowsSolved: number;
   *   escrowsPaid: number;
   *   escrowsCancelled: number;
   * };
   *
   * type EscrowStatistics = {
   *   totalEscrows: number;
   *   dailyEscrowsData: DailyEscrowsData[];
   * };
   * ```
   *
   * @param {IStatisticsFilter} filter Statistics params with duration data
   * @returns {Promise<EscrowStatistics>} Escrow statistics data.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * const escrowStatistics = await statisticsClient.getEscrowStatistics();
   * const escrowStatisticsApril = await statisticsClient.getEscrowStatistics({
   *    from: new Date('2021-04-01'),
   *    to: new Date('2021-04-30'),
   * });
   * ```
   */
  async getEscrowStatistics(
    filter: IStatisticsFilter = {}
  ): Promise<EscrowStatistics> {
    try {
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { escrowStatistics } = await gqlFetch<{
        escrowStatistics: EscrowStatisticsData;
      }>(this.subgraphUrl, GET_ESCROW_STATISTICS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(filter), {
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      });

      return {
        totalEscrows: escrowStatistics?.totalEscrowCount
          ? +escrowStatistics.totalEscrowCount
          : 0,
        dailyEscrowsData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
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
   * type DailyWorkerData = {
   *   timestamp: Date;
   *   activeWorkers: number;
   * };
   *
   * type WorkerStatistics = {
   *   dailyWorkersData: DailyWorkerData[];
   * };
   * ```
   *
   * @param {IStatisticsFilter} filter Statistics params with duration data
   * @returns {Promise<WorkerStatistics>} Worker statistics data.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * const workerStatistics = await statisticsClient.getWorkerStatistics();
   * const workerStatisticsApril = await statisticsClient.getWorkerStatistics({
   *    from: new Date('2021-04-01'),
   *    to: new Date('2021-04-30'),
   * });
   * ```
   */
  async getWorkerStatistics(
    filter: IStatisticsFilter = {}
  ): Promise<WorkerStatistics> {
    try {
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(filter), {
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      });

      return {
        dailyWorkersData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
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
   * type DailyPaymentData = {
   *   timestamp: Date;
   *   totalAmountPaid: BigNumber;
   *   totalCount: number;
   *   averageAmountPerWorker: BigNumber;
   * };
   *
   * type PaymentStatistics = {
   *   dailyPaymentsData: DailyPaymentData[];
   * };
   * ```
   *
   * @param {IStatisticsFilter} filter Statistics params with duration data
   * @returns {Promise<PaymentStatistics>} Payment statistics data.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * console.log(
   *   'Payment statistics:',
   *   (await statisticsClient.getPaymentStatistics()).dailyPaymentsData.map(
   *     (p) => ({
   *       ...p,
   *       totalAmountPaid: p.totalAmountPaid.toString(),
   *       averageAmountPerJob: p.averageAmountPerJob.toString(),
   *       averageAmountPerWorker: p.averageAmountPerWorker.toString(),
   *     })
   *   )
   * );
   *
   * console.log(
   *   'Payment statistics from 5/8 - 6/8:',
   *   (
   *     await statisticsClient.getPaymentStatistics({
   *       from: new Date(2023, 4, 8),
   *       to: new Date(2023, 5, 8),
   *     })
   *   ).dailyPaymentsData.map((p) => ({
   *     ...p,
   *     totalAmountPaid: p.totalAmountPaid.toString(),
   *     averageAmountPerJob: p.averageAmountPerJob.toString(),
   *     averageAmountPerWorker: p.averageAmountPerWorker.toString(),
   *   }))
   * );
   * ```
   */
  async getPaymentStatistics(
    filter: IStatisticsFilter = {}
  ): Promise<PaymentStatistics> {
    try {
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(filter), {
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      });

      return {
        dailyPaymentsData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalAmountPaid: ethers.toBigInt(eventDayData.dailyPayoutAmount),
          totalCount: +eventDayData.dailyPayoutCount,
          averageAmountPerWorker:
            eventDayData.dailyWorkerCount === '0'
              ? ethers.toBigInt(0)
              : ethers.toBigInt(eventDayData.dailyPayoutAmount) /
                ethers.toBigInt(eventDayData.dailyWorkerCount),
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
   * type HMTStatistics = {
   *   totalTransferAmount: BigNumber;
   *   totalTransferCount: BigNumber;
   *   totalHolders: number;
   * };
   * ```
   *
   * @returns {Promise<HMTStatistics>} HMToken statistics data.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * const hmtStatistics = await statisticsClient.getHMTStatistics();
   *
   * console.log('HMT statistics:', {
   *   ...hmtStatistics,
   *   totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
   * });
   * ```
   */
  async getHMTStatistics(): Promise<HMTStatistics> {
    try {
      const { hmtokenStatistics } = await gqlFetch<{
        hmtokenStatistics: HMTStatisticsData;
      }>(this.subgraphUrl, GET_HMTOKEN_STATISTICS_QUERY);

      return {
        totalTransferAmount: ethers.toBigInt(
          hmtokenStatistics.totalValueTransfered
        ),
        totalTransferCount: Number(hmtokenStatistics.totalTransferEventCount),
        totalHolders: +hmtokenStatistics.holders,
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * This function returns the holders of the HMToken with optional filters and ordering.
   *
   * **Input parameters**
   *
   * @param {IHMTHoldersParams} params HMT Holders params with filters and ordering
   * @returns {Promise<HMTHolder[]>} List of HMToken holders.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * const hmtHolders = await statisticsClient.getHMTHolders({
   *   orderDirection: 'asc',
   * });
   *
   * console.log('HMT holders:', hmtHolders.map((h) => ({
   *   ...h,
   *   balance: h.balance.toString(),
   * })));
   * ```
   */
  async getHMTHolders(params: IHMTHoldersParams = {}): Promise<HMTHolder[]> {
    try {
      const { address, orderDirection } = params;
      const query = GET_HOLDERS_QUERY(address);

      const { holders } = await gqlFetch<{ holders: HMTHolderData[] }>(
        this.subgraphUrl,
        query,
        {
          address,
          orderBy: 'balance',
          orderDirection,
        }
      );

      return holders.map((holder) => ({
        address: holder.address,
        balance: ethers.toBigInt(holder.balance),
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
   * type DailyHMTData = {
   *   timestamp: Date;
   *   totalTransactionAmount: bigint;
   *   totalTransactionCount: number;
   *   dailyUniqueSenders: number;
   *   dailyUniqueReceivers: number;
   * }
   * ```
   *
   * @param {IStatisticsFilter} filter Statistics params with duration data
   * @returns {Promise<DailyHMTData[]>} Daily HMToken statistics data.
   *
   * **Code example**
   *
   * ```ts
   * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
   *
   * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
   *
   * const dailyHMTStats = await statisticsClient.getHMTStatistics();
   *
   * console.log('Daily HMT statistics:', dailyHMTStats);
   *
   * const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
   *   from: new Date(2023, 4, 8),
   *   to: new Date(2023, 5, 8),
   * });
   *
   * console.log('HMT statistics from 5/8 - 6/8:', hmtStatisticsRange);
   * ```
   */
  async getHMTDailyData(
    filter: IStatisticsFilter = {}
  ): Promise<DailyHMTData[]> {
    try {
      const first =
        filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
      const skip = filter.skip || 0;
      const orderDirection = filter.orderDirection || OrderDirection.ASC;

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(filter), {
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      });

      return eventDayDatas.map((eventDayData) => ({
        timestamp: new Date(+eventDayData.timestamp * 1000),
        totalTransactionAmount: ethers.toBigInt(
          eventDayData.dailyHMTTransferAmount
        ),
        totalTransactionCount: +eventDayData.dailyHMTTransferCount,
        dailyUniqueSenders: +eventDayData.dailyUniqueSenders,
        dailyUniqueReceivers: +eventDayData.dailyUniqueReceivers,
      }));
    } catch (e: any) {
      return throwError(e);
    }
  }
}
