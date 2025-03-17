/* eslint-disable camelcase -- api response*/
import { z } from 'zod';
import { createPaginationSchema } from '@/shared/helpers/pagination';
import { MyJobStatus, UNKNOWN_JOB_STATUS } from '../types';

const myJobSchema = z.object({
  assignment_id: z.string(),
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string().transform((value) => {
    try {
      return z.nativeEnum(MyJobStatus).parse(value.toUpperCase());
    } catch (error) {
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
