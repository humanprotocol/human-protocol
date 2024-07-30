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
} from './graphql';
import { IHMTHoldersParams, IStatisticsParams } from './interfaces';
import { NetworkData } from './types';
import { getSubgraphUrl, throwError } from './utils';

/**
 * ## Introduction
 *
 * This client enables to obtain statistical information from the subgraph.
 *
 * Unlikely from the other SDK clients, `StatisticsClient` does not require `signer` or `provider` to be provided.
 * We just need to create client object using relevant network data.
 *
 * ```ts
 * constructor(network: NetworkData)
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
 * - **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.
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
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsParams {
   *   from?: Date;
   *   to?: Date;
   *   limit?: number;
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
   *
   * @param {IStatisticsParams} params Statistics params with duration data
   * @returns {EscrowStatistics} Escrow statistics data.
   *
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
    params: IStatisticsParams = {}
  ): Promise<EscrowStatistics> {
    try {
      const { escrowStatistics } = await gqlFetch<{
        escrowStatistics: EscrowStatisticsData;
      }>(this.subgraphUrl, GET_ESCROW_STATISTICS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        totalEscrows: +escrowStatistics.totalEscrowCount,
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
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsParams {
   *   from?: Date;
   *   to?: Date;
   *   limit?: number;
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
   *
   * @param {IStatisticsParams} params Statistics params with duration data
   * @returns {WorkerStatistics} Worker statistics data.
   *
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
    params: IStatisticsParams = {}
  ): Promise<WorkerStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
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
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsParams {
   *   from?: Date;
   *   to?: Date;
   *   limit?: number;
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
   *
   * @param {IStatisticsParams} params Statistics params with duration data
   * @returns {PaymentStatistics} Payment statistics data.
   *
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
    params: IStatisticsParams = {}
  ): Promise<PaymentStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
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
   *
   * **Input parameters**
   *
   * ```ts
   * interface IStatisticsParams {
   *   from?: Date;
   *   to?: Date;
   *   limit?: number;
   * }
   * ```
   *
   * ```ts
   * type HMTHolder = {
   *   address: string;
   *   balance: BigNumber;
   * }
   *
   * type DailyHMTData = {
   *   timestamp: Date;
   *   totalTransactionAmount: BigNumber;
   *   totalTransactionCount: number;
   * };
   *
   * type HMTStatistics = {
   *   totalTransferAmount: BigNumber;
   *   totalTransferCount: BigNumber;
   *   totalHolders: number;
   *   holders: HMTHolder[];
   *   dailyHMTData: DailyHMTData[];
   * };
   * ```
   *
   *
   * @param {IStatisticsParams} params Statistics params with duration data
   * @returns {HMTStatistics} HMToken statistics data.
   *
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
   *   holders: hmtStatistics.holders.map((h) => ({
   *     ...h,
   *     balance: h.balance.toString(),
   *   })),
   *   dailyHMTData: hmtStatistics.dailyHMTData.map((d) => ({
   *     ...d,
   *     totalTransactionAmount: d.totalTransactionAmount.toString(),
   *   })),
   * });
   *
   * const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
   *   from: new Date(2023, 4, 8),
   *   to: new Date(2023, 5, 8),
   * });
   *
   * console.log('HMT statistics from 5/8 - 6/8:', {
   *   ...hmtStatisticsRange,
   *   totalTransferAmount: hmtStatisticsRange.totalTransferAmount.toString(),
   *   holders: hmtStatisticsRange.holders.map((h) => ({
   *     ...h,
   *     balance: h.balance.toString(),
   *   })),
   *   dailyHMTData: hmtStatisticsRange.dailyHMTData.map((d) => ({
   *     ...d,
   *     totalTransactionAmount: d.totalTransactionAmount.toString(),
   *   })),
   * });
   * ```
   */
  async getHMTStatistics(
    params: IStatisticsParams = {}
  ): Promise<HMTStatistics> {
    try {
      const { hmtokenStatistics } = await gqlFetch<{
        hmtokenStatistics: HMTStatisticsData;
      }>(this.subgraphUrl, GET_HMTOKEN_STATISTICS_QUERY);

      const { holders } = await gqlFetch<{
        holders: HMTHolderData[];
      }>(this.subgraphUrl, GET_HOLDERS_QUERY());

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        totalTransferAmount: ethers.toBigInt(
          hmtokenStatistics.totalValueTransfered
        ),
        totalTransferCount: Number(hmtokenStatistics.totalTransferEventCount),
        totalHolders: +hmtokenStatistics.holders,
        holders: holders.map((holder) => ({
          address: holder.address,
          balance: ethers.toBigInt(holder.balance),
        })),
        dailyHMTData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalTransactionAmount: ethers.toBigInt(
            eventDayData.dailyHMTTransferAmount
          ),
          totalTransactionCount: +eventDayData.dailyHMTTransferCount,
          dailyUniqueSenders: +eventDayData.dailyUniqueSenders,
          dailyUniqueReceivers: +eventDayData.dailyUniqueReceivers,
        })),
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
   * @returns {HMTHolder[]} List of HMToken holders.
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
}
