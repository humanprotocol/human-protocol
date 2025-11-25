import { z } from 'zod';
import { createPaginationSchema } from '@/shared/helpers/pagination';
import { MyJobStatus, UNKNOWN_JOB_STATUS } from './types';

const myJobSchema = z.object({
  assignment_id: z.string(),
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string().transform((value) => {
    try {
      return z.enum(MyJobStatus).parse(value.toUpperCase());
    } catch {
      return UNKNOWN_JOB_STATUS;
    }
  }),
  reward_amount: z.string(),
  reward_token: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  url: z.string().optional().nullable(),
});

export const myJobsSuccessResponseSchema = createPaginationSchema(myJobSchema);

export type MyJob = z.infer<typeof myJobSchema>;

export type MyJobPaginationResponse = z.infer<
  typeof myJobsSuccessResponseSchema
>;

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
