/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { StatisticsClient } from '../src/statistics';
import {
  GET_ESCROW_STATISTICS_QUERY,
  GET_EVENT_DAY_DATA_QUERY,
} from '../src/graphql/queries';

vi.mock('axios');

vi.mock('graphql-request', () => ({
  default: vi.fn(),
}));

describe('StatisticsClient', () => {
  let statisticsClient: any;

  beforeEach(async () => {
    if (NETWORKS[ChainId.POLYGON]) {
      statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON]);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        eventDayDatas: [
          {
            timestamp: 1,
            dailyWorkerCount: '4',
          },
        ],
      });

      const from = new Date();
      const to = new Date(from.setDate(from.getDate() + 1));

      const result = await statisticsClient.getWorkerStatistics({
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
        dailyWorkersData: [
          {
            timestamp: new Date(1000),
            activeWorkers: 4,
          },
        ],
      });
    });

    test('should throw error in case gql fetch fails from subgraph', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        statisticsClient.getWorkerStatistics({
          from: new Date(),
          to: new Date(),
        })
      ).rejects.toThrow('Error');

      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
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
            totalAmountPaid: ethers.toBigInt(100),
            totalCount: 4,
            averageAmountPerWorker: ethers.toBigInt(25),
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
        totalTransferAmount: ethers.toBigInt(100),
        totalTransferCount: 4,
        totalHolders: 2,
        holders: [
          {
            address: '0x123',
            balance: ethers.toBigInt(10),
          },
        ],
        dailyHMTData: [
          {
            timestamp: new Date(1000),
            totalTransactionAmount: ethers.toBigInt(100),
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
