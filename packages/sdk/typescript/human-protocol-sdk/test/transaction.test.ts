vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId, OrderDirection } from '../src/enums';
import {
  ErrorCannotUseDateAndBlockSimultaneously,
  ErrorInvalidHashProvided,
} from '../src/error';
import { TransactionData } from '../src/graphql';
import { GET_TRANSACTION_QUERY } from '../src/graphql/queries/transaction';
import { ITransaction, ITransactionsFilter } from '../src/interfaces';
import { TransactionUtils } from '../src/transaction';

describe('TransactionUtils', () => {
  describe('getTransaction', () => {
    const txHash = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
    const invalidHash = 'InvalidHash';

    const mockTransaction = {
      block: '12345',
      txHash: txHash,
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      timestamp: '1625247600',
      value: '1000000000000000000',
      method: 'transfer',
      receiver: null,
      escrow: null,
      token: null,
      internalTransactions: [
        {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567891',
          value: '1000000000000000000',
          method: 'transfer',
          receiver: null,
          escrow: null,
          token: null,
        },
      ],
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
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual(expected);
    });

    test('should throw an error for an invalid transaction hash', async () => {
      await expect(
        TransactionUtils.getTransaction(ChainId.LOCALHOST, invalidHash)
      ).rejects.toThrow(ErrorInvalidHashProvided);
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
    const mockTransaction: TransactionData = {
      block: '12345',
      txHash: '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      timestamp: '1625247600',
      value: '1000000000000000000',
      method: 'transfer',
      receiver: null,
      escrow: null,
      token: null,
      internalTransactions: [
        {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567891',
          value: '1000000000000000000',
          method: 'transfer',
          receiver: null,
          escrow: null,
          token: null,
          id: null,
        },
      ],
    };

    test('should return an array of transactions', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 0,
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
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
      // type assertions (bigint fields)
    });

    test('should return an array of transactions with date filter', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
        first: 10,
        skip: 0,
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
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
    });

    test('should return an array of transactions with address filter', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        fromAddress: '0x1234567890123456789012345678901234567890',
        first: 10,
        skip: 0,
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
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
    });

    test('should return an array of transactions filtered by method', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        method: 'transfer',
        first: 10,
        skip: 0,
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
          method: 'transfer',
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected]);
    });

    test('should return an array of transactions filtered by escrow', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        escrow: '0x1234567890123456789012345678901234567890',
        first: 10,
        skip: 0,
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
          method: undefined,
          escrow: '0x1234567890123456789012345678901234567890',
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected]);
    });

    test('should return an array of transactions filtered by token', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        token: '0x1234567890123456789012345678901234567890',
        first: 10,
        skip: 0,
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
          method: undefined,
          escrow: undefined,
          token: '0x1234567890123456789012345678901234567890',
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected]);
    });

    test('should throw an error if both date and block filters are used', async () => {
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        startDate: new Date('2022-01-01'),
        endBlock: 100000,
        first: 10,
        skip: 0,
      };

      await expect(TransactionUtils.getTransactions(filter)).rejects.toThrow(
        ErrorCannotUseDateAndBlockSimultaneously
      );
    });

    test('should throw an error if the gql fetch fails', async () => {
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 0,
      };

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(TransactionUtils.getTransactions(filter)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return an array of transactions with pagination', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: 10,
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
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 10,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
    });

    test('should return an array of transactions with pagination over limits', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        first: 2000,
        skip: 10,
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
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 1000,
          skip: 10,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
    });

    test('should return an array of transactions with pagination and filters', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        transactions: [mockTransaction, mockTransaction],
      });
      const filter: ITransactionsFilter = {
        chainId: ChainId.LOCALHOST,
        fromAddress: '0x1234567890123456789012345678901234567890',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
        first: 5,
        skip: 5,
      };

      const result = await TransactionUtils.getTransactions(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        expect.anything(),
        {
          fromAddress: filter.fromAddress,
          toAddress: undefined,
          startDate: Math.floor(filter.startDate!.getTime() / 1000),
          endDate: Math.floor(filter.endDate!.getTime() / 1000),
          startBlock: undefined,
          endBlock: undefined,
          method: undefined,
          escrow: undefined,
          receiver: undefined,
          orderDirection: OrderDirection.DESC,
          first: 5,
          skip: 5,
        },
        undefined
      );
      const expected: ITransaction = {
        block: 12345n,
        txHash: mockTransaction.txHash,
        from: mockTransaction.from,
        to: mockTransaction.to,
        timestamp: 1625247600000,
        value: 1000000000000000000n,
        method: 'transfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: mockTransaction.internalTransactions[0].from,
            to: mockTransaction.internalTransactions[0].to,
            value: 1000000000000000000n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      };
      expect(result).toEqual([expected, expected]);
    });
  });
});
