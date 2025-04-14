import { type z } from 'zod';
import {
  type uiConfigSchema,
  type availableJobSchema,
  type availableJobsSuccessResponseSchema,
} from './schemas';

export enum MyJobStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  VALIDATION = 'VALIDATION',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export const UNKNOWN_JOB_STATUS = 'UNKNOWN';

export enum SortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  ESCROW_ADDRESS = 'escrow_address',
  EXPIRES_AT = 'expires_at',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type UiConfig = z.infer<typeof uiConfigSchema>;

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;
