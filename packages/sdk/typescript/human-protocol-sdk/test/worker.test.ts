import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { ErrorInvalidAddress } from '../src/error';
import {
  GET_WORKER_QUERY,
  GET_WORKERS_QUERY,
} from '../src/graphql/queries/worker';
import { IWorker, IWorkersFilter } from '../src/interfaces';
import { WorkerUtils } from '../src/worker';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

describe('WorkerUtils', () => {
  describe('getWorker', () => {
    const workerAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const mockWorker: IWorker = {
      id: workerAddress,
      address: workerAddress,
      totalAmountReceived: 1000,
      payoutCount: 10,
    };

    test('should return worker details', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        worker: mockWorker,
      });

      const result = await WorkerUtils.getWorker(
        ChainId.LOCALHOST,
        workerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_WORKER_QUERY,
        {
          address: workerAddress.toLowerCase(),
        }
      );
      expect(result).toEqual(mockWorker);
    });

    test('should return null if worker is not found', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        worker: null,
      });

      const result = await WorkerUtils.getWorker(
        ChainId.LOCALHOST,
        workerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_WORKER_QUERY,
        {
          address: workerAddress.toLowerCase(),
        }
      );
      expect(result).toBeNull();
    });

    test('should throw an error for an invalid transaction hash', async () => {
      await expect(
        WorkerUtils.getWorker(ChainId.LOCALHOST, 'invalid_address')
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        WorkerUtils.getWorker(ChainId.LOCALHOST, workerAddress)
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkers', () => {
    const mockWorkers: IWorker[] = [
      {
        id: '0x1234567890abcdef1234567890abcdef12345678',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        totalAmountReceived: 1000,
        payoutCount: 10,
      },
      {
        id: '0xabcdefabcdefabcdefabcdefabcdefabcdef',
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdef',
        totalAmountReceived: 2000,
        payoutCount: 20,
      },
    ];

    test('should return a list of workers', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        workers: mockWorkers,
      });

      const filter: IWorkersFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 0,
      };

      const result = await WorkerUtils.getWorkers(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[filter.chainId]?.subgraphUrl,
        GET_WORKERS_QUERY(filter),
        {
          address: undefined,
          first: 10,
          skip: 0,
        }
      );
      expect(result).toEqual(mockWorkers);
    });

    test('should return an empty list if no workers are found', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        workers: [],
      });

      const filter: IWorkersFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 0,
      };

      const result = await WorkerUtils.getWorkers(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[filter.chainId]?.subgraphUrl,
        GET_WORKERS_QUERY(filter),
        {
          address: undefined,
          first: 10,
          skip: 0,
        }
      );
      expect(result).toEqual([]);
    });
    test('should throw an error if the gql fetch fails', async () => {
      const filter: IWorkersFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 0,
      };

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(WorkerUtils.getWorkers(filter)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return an array of transactions with pagination over limits', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        workers: mockWorkers,
      });

      const filter: IWorkersFilter = {
        chainId: ChainId.LOCALHOST,
        first: 2000,
        skip: 0,
      };

      const result = await WorkerUtils.getWorkers(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[filter.chainId]?.subgraphUrl,
        GET_WORKERS_QUERY(filter),
        {
          address: undefined,
          first: 1000,
          skip: 0,
        }
      );
      expect(result).toEqual(mockWorkers);
    });
  });
});
