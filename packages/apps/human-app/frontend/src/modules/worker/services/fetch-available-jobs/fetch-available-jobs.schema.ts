/* eslint-disable camelcase -- api response*/
import { z } from 'zod';
import { createPaginationSchema } from '@/shared/helpers/pagination';

export const availableJobSchema = z.object({
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
  job_description: z.string().optional(),
  reward_amount: z.string().optional(),
  reward_token: z.string().optional(),
});

export const availableJobsSuccessResponseSchema =
  createPaginationSchema(availableJobSchema);
