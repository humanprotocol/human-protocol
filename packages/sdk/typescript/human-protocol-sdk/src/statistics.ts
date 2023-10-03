/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { BigNumber } from 'ethers';
import gqlFetch from 'graphql-request';

import { ChainId } from './enums';
import {
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
  GET_HOLDERS_QUERY,
  GET_HMTOKEN_STATISTICS_QUERY,
  GET_PAYOUTS_QUERY,
  EscrowStatistics,
  EscrowStatisticsData,
  EventDayData,
  HMTStatistics,
  HMTStatisticsData,
  PaymentStatistics,
  WorkerStatistics,
  HMTHolderData,
  TaskStatistics,
  IMData,
  PayoutData,
} from './graphql';
import { IStatisticsParams } from './interfaces';
import { NetworkData } from './types';
import { throwError } from './utils';

export class StatisticsClient {
  public network: NetworkData;
  private IMAPIKey: string;

  /**
   * **StatisticsClient constructor**
   *
   * @param {NetworkData} network - The network information required to connect to the Statistics contract
   */
  constructor(network: NetworkData, IMAPIKey = '') {
    this.network = network;
    this.IMAPIKey = IMAPIKey;
  }

  /**
   * Gets the IM data for the given date range
   * IM API now limits the date range to 60 days, so we need to make multiple requests
   * if the date range is greater than 60 days
   *
   * If the filter is empty, returns the last 60 days of data
   *
   * If the network is not Polygon, returns an empty object
   * TODO: Remove this once the IM API is available on all networks
   *
   * @param {IStatisticsParams} params - Filter parameters.
   * @returns {Promise<IMData>}
   * @throws {Error} - An error object if an error occurred.
   */
  private async getIMData(params: IStatisticsParams = {}): Promise<IMData> {
    if (this.network.chainId !== ChainId.POLYGON) {
      return {};
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const defaultFromDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    defaultFromDate.setDate(today.getDate() - 60);

    const from = params.from ? new Date(params.from) : defaultFromDate;
    const to = params.to ? new Date(params.to) : today;

    // IM API now limits the date range to 60 days, so we need to make multiple requests
    // if the date range is greater than 60 days
    const chunks = [];
    let start = from;
    while (start < to) {
      const end = new Date(start);
      end.setDate(start.getDate() + 60);
      chunks.push({ from: start, to: end.getDate() < to.getDate() ? end : to });
      start = end;
    }

    return await Promise.all(
      chunks.map(({ from, to }) =>
        axios
          .get('/support/summary-stats', {
            baseURL: 'https://foundation-accounts.hmt.ai',
            method: 'GET',
            params: {
              start_date: from.toISOString().slice(0, 10),
              end_date: to.toISOString().slice(0, 10),
              api_key: this.IMAPIKey,
            },
          })
          .then((res) => res.data)
      )
    ).then((chunks) =>
      chunks.reduce(
        // Exclude total from the aggregated data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (aggregated, { total, ...chunkData }) => ({
          ...aggregated,
          ...chunkData,
        }),
        {}
      )
    );
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

  async getTaskStatistics(
    params: IStatisticsParams = {}
  ): Promise<TaskStatistics> {
    try {
      const data = await this.getIMData(params);

      return {
        dailyTasksData: Object.entries(data).map(([key, value]) => ({
          timestamp: new Date(key),
          tasksTotal: value.served,
          tasksSolved: value.solved,
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
      const data = await this.getIMData(params);

      return {
        dailyWorkersData: await Promise.all(
          Object.entries(data).map(async ([key, value]) => {
            const timestamp = new Date(key);
            const fromDate = new Date(key);
            const toDate = new Date(key);
            toDate.setDate(toDate.getDate() + 1);

            const { payouts } = await gqlFetch<{
              payouts: PayoutData[];
            }>(
              this.network.subgraphUrl,
              GET_PAYOUTS_QUERY({
                from: fromDate,
                to: toDate,
              }),
              {
                from: fromDate.getTime() / 1000,
                to: toDate.getTime() / 1000,
              }
            );

            const activeWorkers = new Set(
              payouts.map(({ recipient }) => recipient)
            ).size;

            return {
              timestamp,
              activeWorkers,
              averageJobsSolved: activeWorkers
                ? value.solved / activeWorkers
                : 0,
            };
          })
        ),
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
