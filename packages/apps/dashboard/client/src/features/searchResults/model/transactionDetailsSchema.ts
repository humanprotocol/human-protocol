import { z } from 'zod';

const internalTransactionSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string(),
  method: z.string(),
  receiver: z.string().nullable(),
  escrow: z.string().nullable(),
  token: z.string().nullable(),
});

const transactionDetailsSchema = z.object({
  txHash: z.string(),
  method: z.string(),
  from: z.string(),
  to: z.string(),
  receiver: z.string().nullable(),
  block: z.number(),
  value: z.string(),
  internalTransactions: z.array(internalTransactionSchema),
});

export type TransactionDetails = z.infer<typeof transactionDetailsSchema>;

export const paginatedTransactionDetailsSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  first: z.number(),
  skip: z.number(),
  results: z.array(transactionDetailsSchema),
});

export type PaginatedTransactionDetails = z.infer<
  typeof paginatedTransactionDetailsSchema
>;
