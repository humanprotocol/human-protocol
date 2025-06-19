import { z } from 'zod';

const escrowDetailsSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  status: z.string(),
});

export type EscrowDetails = z.infer<typeof escrowDetailsSchema>;

export const paginatedEscrowDetailsSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  first: z.number(),
  skip: z.number(),
  results: z.array(escrowDetailsSchema),
});

export type PaginatedEscrowDetails = z.infer<
  typeof paginatedEscrowDetailsSchema
>;
