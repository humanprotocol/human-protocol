/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from './graphql';
import { IStatisticsParams } from './interfaces';
import { NetworkData } from './types';
import { throwError } from './utils';
import { BigNumber } from 'ethers';

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
    params: IStatisticsParams = {}
  ): Promise<EscrowStatistics> {
    try {
      const { escrowStatistics } = await gqlFetch<{
        escrowStatistics: EscrowStatisticsData;
      }>(this.network.subgraphUrl, GET_ESCROW_STATISTICS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
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
    params: IStatisticsParams = {}
  ): Promise<WorkerStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        dailyWorkersData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          activeWorkers: +eventDayData.dailyWorkerCount,
          averageJobsSolved:
            eventDayData.dailyWorkerCount === '0'
              ? 0
              : +eventDayData.dailyBulkPayoutEventCount /
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
    params: IStatisticsParams = {}
  ): Promise<PaymentStatistics> {
    try {
      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        dailyPaymentsData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalAmountPaid: BigNumber.from(eventDayData.dailyPayoutAmount),
          totalCount: +eventDayData.dailyPayoutCount,
          averageAmountPerJob:
            eventDayData.dailyBulkPayoutEventCount === '0'
              ? BigNumber.from(0)
              : BigNumber.from(eventDayData.dailyPayoutAmount).div(
                  eventDayData.dailyBulkPayoutEventCount
                ),
          averageAmountPerWorker:
            eventDayData.dailyWorkerCount === '0'
              ? BigNumber.from(0)
              : BigNumber.from(eventDayData.dailyPayoutAmount).div(
                  eventDayData.dailyWorkerCount
                ),
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
  async getHMTStatistics(
    params: IStatisticsParams = {}
  ): Promise<HMTStatistics> {
    try {
      const { hmtokenStatistics } = await gqlFetch<{
        hmtokenStatistics: HMTStatisticsData;
      }>(this.network.subgraphUrl, GET_HMTOKEN_STATISTICS_QUERY);

      const { holders } = await gqlFetch<{
        holders: HMTHolderData[];
      }>(this.network.subgraphUrl, GET_HOLDERS_QUERY);

      const { eventDayDatas } = await gqlFetch<{
        eventDayDatas: EventDayData[];
      }>(this.network.subgraphUrl, GET_EVENT_DAY_DATA_QUERY(params), {
        from: params.from ? params.from.getTime() / 1000 : undefined,
        to: params.to ? params.to.getTime() / 1000 : undefined,
      });

      return {
        totalTransferAmount: BigNumber.from(
          hmtokenStatistics.totalValueTransfered
        ),
        totalHolders: +hmtokenStatistics.holders,
        holders: holders.map((holder) => ({
          address: holder.address,
          balance: BigNumber.from(holder.balance),
        })),
        dailyHMTData: eventDayDatas.map((eventDayData) => ({
          timestamp: new Date(+eventDayData.timestamp * 1000),
          totalTransactionAmount: BigNumber.from(
            eventDayData.dailyHMTTransferAmount
          ),
          totalTransactionCount: +eventDayData.dailyHMTTransferCount,
        })),
      };
    } catch (e: any) {
      return throwError(e);
    }
  }
}
