/* eslint-disable @typescript-eslint/no-explicit-any */
import gqlFetch from 'graphql-request';

import { IStatisticsParams } from './interfaces';
import { NetworkData } from './types';
import { throwError } from './utils';
import {
  EscrowStatistics,
  EscrowStatisticsData,
  EventDayData,
  HMTHolder,
  HMTStatistics,
  HMTStatisticsData,
  PaymentStatistics,
  WorkerStatistics,
} from './graphql';
import {
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
  GET_HMTOKEN_STATISTICS_QUERY,
} from './graphql/queries/statistics';
import { GET_HOLDERS_QUERY } from './graphql/queries/hmtoken';

export class StatisticsClient {
  public network: NetworkData;

  /**
   * **StatisticsClient constructor**
   *
   * @param {NetworkData} network - The network information required to connect to the Statistics contract
   */
  constructor(network: NetworkData) {
    this.network = network;
  }

  /**
   * Returns the escrow statistics data for the given date range
   *
   * @param {IStatisticsParams} params - Filter parameters.
   * @returns {Promise<EscrowStatistics>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getEscrowStatistics(
    params: IStatisticsParams
  ): Promise<EscrowStatistics> {
    try {
      const { escrowStatistics } = await gqlFetch<{
        escrowStatistics: EscrowStatisticsData;
      }>(this.network.subgraphUrl, GET_ESCROW_STATISTICS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY, {
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
   * Returns the worker statistics data for the given date range
   *
   * @param {IStatisticsParams} params - Filter parameters.
   * @returns {Promise<WorkerStatistics>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getWorkerStatistics(
    params: IStatisticsParams
  ): Promise<WorkerStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY, {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        dailyWorkersData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          activeWorkers: +eventDayData.dailyWorkerCount,
          averageJobsSolved:
            +eventDayData.dailyCompletedStatusEventCount /
            +eventDayData.dailyWorkerCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the payment statistics data for the given date range
   *
   * @param {IStatisticsParams} params - Filter parameters.
   * @returns {Promise<PaymentStatistics>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getPaymentStatistics(
    params: IStatisticsParams
  ): Promise<PaymentStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY, {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        dailyPaymentsData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalAmountPaid: +eventDayData.dailyPayoutAmount,
          totalCount: +eventDayData.dailyPayoutCount,
          averageAmountPerJob:
            +eventDayData.dailyPayoutAmount /
            +eventDayData.dailyCompletedStatusEventCount,
          averageAmountPerWorker:
            +eventDayData.dailyPayoutAmount / +eventDayData.dailyWorkerCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }

  /**
   * Returns the HMToken statistics data for the given date range
   *
   * @param {IStatisticsParams} params - Filter parameters.
   * @returns {Promise<HMTStatistics>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getHMTStatistics(params: IStatisticsParams): Promise<HMTStatistics> {
    try {
      const { hmTokenStatistics } = await gqlFetch<{
        hmTokenStatistics: HMTStatisticsData;
      }>(this.network.subgraphUrl, GET_HMTOKEN_STATISTICS_QUERY);

      const { holders } = await gqlFetch<{
        holders: HMTHolder[];
      }>(this.network.subgraphUrl, GET_HOLDERS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY, {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        totalTransferAmount: +hmTokenStatistics.totalValueTransfered,
        totalHolders: +hmTokenStatistics.holders,
        holders,
        dailyHMTData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalTransactionAmount: +eventDayData.dailyHMTTransferAmount,
          totalTransactionCount: +eventDayData.dailyHMTTransferCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }
}
