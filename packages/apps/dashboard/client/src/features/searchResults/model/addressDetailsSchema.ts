import { Role } from '@human-protocol/sdk/src/constants';
import { z } from 'zod';

import { reputationSchema } from '@/shared/model/reputationSchema';

const walletSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  balance: z.string(),
  stakedAmount: z.string(),
  lockedAmount: z.string(),
  withdrawableAmount: z.string(),
  reputation: reputationSchema,
  totalHMTAmountReceived: z.string(),
  payoutCount: z.number().or(z.string()),
});

export type AddressDetailsWallet = z.infer<typeof walletSchema>;

const escrowSchema = z.object({
  chainId: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  balance: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
  factoryAddress: z.string().optional().nullable(),
  totalFundedAmount: z.string().optional().nullable(),
  amountPaid: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  manifest: z.string().optional().nullable(),
  launcher: z.string().optional().nullable(),
  exchangeOracle: z.string().optional().nullable(),
  recordingOracle: z.string().optional().nullable(),
  reputationOracle: z.string().optional().nullable(),
  finalResultsUrl: z.string().nullable(),
  tokenSymbol: z.string().optional().nullable(),
  tokenDecimals: z.number().optional().nullable(),
});

export type AddressDetailsEscrow = z.infer<typeof escrowSchema>;

const operatorSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  balance: z.string(),
  role: z
    .enum([
      Role.JobLauncher,
      Role.ExchangeOracle,
      Role.RecordingOracle,
      Role.ReputationOracle,
    ])
    .nullable(),
  stakedAmount: z.string().optional(),
  lockedAmount: z.string().optional(),
  withdrawableAmount: z.string().optional(),
  lockedUntilTimestamp: z.string().optional(),
  reputation: reputationSchema,
  fee: z.number().optional().nullable(),
  jobTypes: z.array(z.string()).optional().nullable(),
  url: z.string().optional().nullable(),
  reward: z.string().optional(),
  amountJobsProcessed: z.number(),
});

export type AddressDetailsOperator = z.infer<typeof operatorSchema>;

export const addressDetailsResponseSchema = z.object({
  wallet: z.optional(walletSchema),
  escrow: z.optional(escrowSchema),
  operator: z.optional(operatorSchema),
});

export type AddressDetails = z.infer<typeof addressDetailsResponseSchema>;
