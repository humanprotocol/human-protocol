/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import {
  ErrorCannotUseDateAndBlockSimultaneously,
  ErrorInvalidHahsProvided,
} from '../src/error';
import { GET_TRANSACTION_QUERY } from '../src/graphql/queries/transaction';
import { ITransaction, ITransactionsFilter } from '../src/interfaces';
import { TransactionUtils } from '../src/transaction';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

describe('TransactionUtils', () => {
  describe('getTransaction', () => {
    const txHash = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
    const invalidHash = 'InvalidHash';

    const mockTransaction: ITransaction = {
      block: 12345n,
      hash: txHash,
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      timestamp: 1625247600n,
      value: '1000000000000000000',
      method: 'transfer',
    };

    test('should return transaction information', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transaction: mockTransaction,
      });

      const result = await TransactionUtils.getTransaction(
        ChainId.LOCALHOST,
        txHash
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_TRANSACTION_QUERY,
        {
          hash: txHash.toLowerCase(),
        }
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should throw an error for an invalid transaction hash', async () => {
      await expect(
        TransactionUtils.getTransaction(ChainId.LOCALHOST, invalidHash)
      ).rejects.toThrow(ErrorInvalidHahsProvided);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        TransactionUtils.getTransaction(ChainId.LOCALHOST, txHash)
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactions', () => {
    const mockTransaction: ITransaction = {
      block: 12345n,
      hash: '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      timestamp: 1625247600n,
      value: '1000000000000000000',
      method: 'transfer',
    };

    test('should return an array of transactions', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        networks: [ChainId.LOCALHOST],
      };

      const result = await TransactionUtils.getTransactions(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        expect.anything(),
        {
          fromAddress: undefined,
          toAddress: undefined,
          startDate: undefined,
          endDate: undefined,
          startBlock: undefined,
          endBlock: undefined,
        }
      );
      expect(result).toEqual([mockTransaction, mockTransaction]);
    });

    test('should return an array of transactions with date filter', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        networks: [ChainId.LOCALHOST],
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };

      const result = await TransactionUtils.getTransactions(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        expect.anything(),
        {
          fromAddress: undefined,
          toAddress: undefined,
          startDate: Math.floor(filter.startDate!.getTime() / 1000),
          endDate: Math.floor(filter.endDate!.getTime() / 1000),
          startBlock: undefined,
          endBlock: undefined,
        }
      );
      expect(result).toEqual([mockTransaction, mockTransaction]);
    });

    test('should return an array of transactions with address filter', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        networks: [ChainId.LOCALHOST],
        fromAddress: '0x1234567890123456789012345678901234567890',
      };

      const result = await TransactionUtils.getTransactions(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        expect.anything(),
        {
          fromAddress: filter.fromAddress,
          toAddress: undefined,
          startDate: undefined,
          endDate: undefined,
          startBlock: undefined,
          endBlock: undefined,
        }
      );
      expect(result).toEqual([mockTransaction, mockTransaction]);
    });

    test('should throw an error if both date and block filters are used', async () => {
      const filter: ITransactionsFilter = {
        networks: [ChainId.LOCALHOST],
        startDate: new Date('2022-01-01'),
        endBlock: 100000,
      };

      await expect(TransactionUtils.getTransactions(filter)).rejects.toThrow(
        ErrorCannotUseDateAndBlockSimultaneously
      );
    });

    test('should throw an error if the gql fetch fails', async () => {
      const filter: ITransactionsFilter = {
        networks: [ChainId.LOCALHOST],
      };

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(TransactionUtils.getTransactions(filter)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
