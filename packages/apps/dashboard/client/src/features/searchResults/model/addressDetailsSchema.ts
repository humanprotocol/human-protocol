import { Role } from '@human-protocol/sdk';
import { z } from 'zod';

import { reputationSchema } from '@/features/leaderboard/model/leaderboardSchema';

const transformOptionalTokenAmount = (
  value: string | undefined | null,
  ctx: z.RefinementCtx
) => {
  if (value === undefined || value === null) return value;

  const valueAsNumber = Number(value);

  if (Number.isNaN(valueAsNumber)) {
    ctx.addIssue({
      path: ['amountStaked'],
      code: z.ZodIssueCode.custom,
    });
  }

  return valueAsNumber / 10 ** 18;
};

const walletSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  balance: z.string().transform(transformOptionalTokenAmount),
  amountStaked: z.string().transform(transformOptionalTokenAmount),
  amountLocked: z.string().transform(transformOptionalTokenAmount),
  amountWithdrawable: z.string().transform(transformOptionalTokenAmount),
  reputation: reputationSchema,
  totalHMTAmountReceived: z.string().transform(transformOptionalTokenAmount),
  payoutCount: z.number().or(z.string()),
});

export type AddressDetailsWallet = z.infer<typeof walletSchema>;

const escrowSchema = z.object({
  chainId: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  balance: z
    .string()
    .optional()
    .nullable()
    .transform(transformOptionalTokenAmount),
  token: z.string().optional().nullable(),
  factoryAddress: z.string().optional().nullable(),
  totalFundedAmount: z
    .string()
    .optional()
    .nullable()
    .transform(transformOptionalTokenAmount),
  amountPaid: z
    .string()
    .optional()
    .nullable()
    .transform(transformOptionalTokenAmount),
  status: z.string().optional().nullable(),
  manifest: z.string().optional().nullable(),
  launcher: z.string().optional().nullable(),
  exchangeOracle: z.string().optional().nullable(),
  recordingOracle: z.string().optional().nullable(),
  reputationOracle: z.string().optional().nullable(),
  finalResultsUrl: z.string().nullable(),
});

export type AddressDetailsEscrow = z.infer<typeof escrowSchema>;

const operatorSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  balance: z.string().transform(transformOptionalTokenAmount),
  role: z
    .enum([
      Role.JobLauncher,
      Role.ExchangeOracle,
      Role.RecordingOracle,
      Role.ReputationOracle,
    ])
    .nullable(),
  amountStaked: z.string().optional().transform(transformOptionalTokenAmount),
  amountLocked: z.string().optional().transform(transformOptionalTokenAmount),
  amountWithdrawable: z
    .string()
    .optional()
    .transform(transformOptionalTokenAmount),
  lockedUntilTimestamp: z.string().optional(),
  reputation: reputationSchema,
  fee: z.number(),
  jobTypes: z.array(z.string()).optional().nullable(),
  url: z.string().optional().nullable(),
  reward: z.string().optional(),
  amountJobsProcessed: z.string(),
});

export type AddressDetailsOperator = z.infer<typeof operatorSchema>;

export const addressDetailsResponseSchema = z.object({
  wallet: z.optional(walletSchema),
  escrow: z.optional(escrowSchema),
  operator: z.optional(operatorSchema),
});

export type AddressDetails = z.infer<typeof addressDetailsResponseSchema>;
