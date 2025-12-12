import { z } from 'zod';

export const operatorStatsSuccessResponseSchema = z.object({
  workers_total: z.number(),
  assignments_completed: z.number(),
  assignments_expired: z.number(),
  assignments_rejected: z.number(),
  escrows_processed: z.number(),
  escrows_active: z.number(),
  escrows_cancelled: z.number(),
});
