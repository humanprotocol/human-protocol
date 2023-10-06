/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { BigNumber } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { StatisticsClient } from '../src/statistics';
import {
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
  GET_PAYOUTS_QUERY,
} from '../src/graphql/queries';

const MOCK_API_KEY = 'MOCK_API_KEY';

vi.mock('axios');

vi.mock('graphql-request', () => ({
  default: vi.fn(),
}));

describe('StatisticsClient', () => {
  let statisticsClient: any;

  beforeEach(async () => {
    if (NETWORKS[ChainId.POLYGON]) {
      statisticsClient = new StatisticsClient(
        NETWORKS[ChainId.POLYGON],
        MOCK_API_KEY
      );
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTaskStatistics', () => {
    test('should successfully get task statistics', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          '2023-09-30': { served: 784983, solved: 761730 },
          '2023-10-01': { served: 772217, solved: 749837 },
          '2023-10-02': { served: 877682, solved: 852250 },
          total: { served: 2434882, solved: 2363817 },
        },
      });

      const from = new Date();
      from.setDate(from.getDate() - 3);
      const to = new Date();

      const result = await statisticsClient.getTaskStatistics({
        from,
        to,
      });

      expect(axiosGetSpy).toHaveBeenCalledWith('/support/summary-stats', {
        baseURL: 'https://foundation-accounts.hmt.ai',
        method: 'GET',
        params: {
          start_date: from.toISOString().slice(0, 10),
          end_date: to.toISOString().slice(0, 10),
          api_key: MOCK_API_KEY,
        },
      });

      expect(result).toEqual({
        dailyTasksData: [
          {
            timestamp: new Date('2023-09-30'),
            tasksTotal: 784983,
            tasksSolved: 761730,
          },
          {
            timestamp: new Date('2023-10-01'),
            tasksTotal: 772217,
            tasksSolved: 749837,
          },
          {
            timestamp: new Date('2023-10-02'),
            tasksTotal: 877682,
            tasksSolved: 852250,
          },
        ],
      });
    });

    test('should throw error in case IM API fails', async () => {
      const axiosGetSpy = vi
        .spyOn(axios, 'get')
        .mockRejectedValueOnce(new Error('Error'));

      const from = new Date();
      from.setDate(from.getDate() - 3);
      const to = new Date();

      await expect(
        statisticsClient.getTaskStatistics({
          from,
          to,
        })
      ).rejects.toThrow('Error');

      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEscrowStatistics', () => {
    test('should successfully get escrow statistics', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({
          escrowStatistics: {
            totalEscrowCount: '1',
          },
        })
        .mockResolvedValueOnce({
          eventDayDatas: [
            {
              timestamp: 1,
              dailyEscrowCount: '1',
              dailyPendingStatusEventCount: '1',
              dailyCancelledStatusEventCount: '1',
              dailyPartialStatusEventCount: '1',
              dailyPaidStatusEventCount: '1',
              dailyCompletedStatusEventCount: '1',
            },
          ],
        });

      const from = new Date();
      const to = new Date(from.setDate(from.getDate() + 1));

      const result = await statisticsClient.getEscrowStatistics({
        from,
        to,
      });

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
        GET_ESCROW_STATISTICS_QUERY
      );
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
        GET_EVENT_DAY_DATA_QUERY({ from, to }),
        {
          from: from.getTime() / 1000,
          to: to.getTime() / 1000,
        }
      );

      expect(result).toEqual({
        totalEscrows: 1,
        dailyEscrowsData: [
          {
            timestamp: new Date(1000),
            escrowsTotal: 1,
            escrowsPending: 1,
            escrowsSolved: 1,
            escrowsPaid: 1,
            escrowsCancelled: 1,
          },
        ],
      });
    });

    test('should throw error in case gql fetch fails from subgraph', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        statisticsClient.getEscrowStatistics({
          from: new Date(),
          to: new Date(),
        })
      ).rejects.toThrow('Error');

      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkerStatistics', () => {
    test('should successfully get worker statistics', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          '2023-09-30': { served: 784983, solved: 761730 },
          '2023-10-01': { served: 772217, solved: 749837 },
          '2023-10-02': { served: 877682, solved: 852250 },
          total: { served: 2434882, solved: 2363817 },
        },
      });

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValue({
        payouts: [
          {
            timestamp: 1,
            recipient: '0x123',
          },
        ],
      });

      const from = new Date();
      from.setDate(from.getDate() - 3);
      const to = new Date();

      const result = await statisticsClient.getWorkerStatistics({
        from,
        to,
      });

      expect(axiosGetSpy).toHaveBeenCalledWith('/support/summary-stats', {
        baseURL: 'https://foundation-accounts.hmt.ai',
        method: 'GET',
        params: {
          start_date: from.toISOString().slice(0, 10),
          end_date: to.toISOString().slice(0, 10),
          api_key: MOCK_API_KEY,
        },
      });

      const payoutFrom = new Date('2023-09-30');
      const payoutTo = new Date('2023-10-01');

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
        GET_PAYOUTS_QUERY({ from: payoutFrom, to: payoutTo }),
        {
          from: payoutFrom.getTime() / 1000,
          to: payoutTo.getTime() / 1000,
        }
      );

      expect(result).toEqual({
        dailyWorkersData: [
          {
            timestamp: new Date('2023-09-30'),
            activeWorkers: 1,
            averageJobsSolved: 761730,
          },
          {
            timestamp: new Date('2023-10-01'),
            activeWorkers: 1,
            averageJobsSolved: 749837,
          },
          {
            timestamp: new Date('2023-10-02'),
            activeWorkers: 1,
            averageJobsSolved: 852250,
          },
        ],
      });
    });

    test('should throw error in case IM API fails', async () => {
      const axiosGetSpy = vi
        .spyOn(axios, 'get')
        .mockRejectedValueOnce(new Error('Error'));

      const from = new Date();
      from.setDate(from.getDate() - 3);
      const to = new Date();

      await expect(
        statisticsClient.getWorkerStatistics({
          from,
          to,
        })
      ).rejects.toThrow('Error');

      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPaymentStatistics', () => {
    test('should successfully get payment statistics', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        eventDayDatas: [
          {
            timestamp: 1,
            dailyPayoutCount: '4',
            dailyPayoutAmount: '100',
            dailyWorkerCount: '4',
            dailyBulkPayoutEventCount: '2',
          },
        ],
      });

      const from = new Date();
      const to = new Date(from.setDate(from.getDate() + 1));

      const result = await statisticsClient.getPaymentStatistics({
        from,
        to,
      });

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
        GET_EVENT_DAY_DATA_QUERY({ from, to }),
        {
          from: from.getTime() / 1000,
          to: to.getTime() / 1000,
        }
      );

      expect(result).toEqual({
        dailyPaymentsData: [
          {
            timestamp: new Date(1000),
            totalAmountPaid: BigNumber.from(100),
            totalCount: 4,
            averageAmountPerJob: BigNumber.from(50),
            averageAmountPerWorker: BigNumber.from(25),
          },
        ],
      });
    });

    test('should throw error in case gql fetch fails from subgraph', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        statisticsClient.getPaymentStatistics({
          from: new Date(),
          to: new Date(),
        })
      ).rejects.toThrow('Error');

      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHMTStatistics', () => {
    test('should successfully get HMT statistics', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({
          hmtokenStatistics: {
            totalValueTransfered: '100',
            totalTransferEventCount: '4',
            holders: '2',
          },
        })
        .mockResolvedValueOnce({
          holders: [
            {
              address: '0x123',
              balance: '10',
            },
          ],
        })
        .mockResolvedValueOnce({
          eventDayDatas: [
            {
              timestamp: 1,
              dailyHMTTransferCount: '4',
              dailyHMTTransferAmount: '100',
            },
          ],
        });

      const from = new Date();
      const to = new Date(from.setDate(from.getDate() + 1));

      const result = await statisticsClient.getHMTStatistics({
        from,
        to,
      });

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
        GET_EVENT_DAY_DATA_QUERY({ from, to }),
        {
          from: from.getTime() / 1000,
          to: to.getTime() / 1000,
        }
      );

      expect(result).toEqual({
        totalTransferAmount: BigNumber.from(100),
        totalTransferCount: 4,
        totalHolders: 2,
        holders: [
          {
            address: '0x123',
            balance: BigNumber.from(10),
          },
        ],
        dailyHMTData: [
          {
            timestamp: new Date(1000),
            totalTransactionAmount: BigNumber.from(100),
            totalTransactionCount: 4,
          },
        ],
      });
    });

    test('should throw error in case gql fetch fails from subgraph', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        statisticsClient.getHMTStatistics({
          from: new Date(),
          to: new Date(),
        })
      ).rejects.toThrow('Error');

      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
