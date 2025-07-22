import { type z } from 'zod';
import {
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

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;

export interface RejectTaskBody {
  assignment_id: string;
  oracle_address: string;
}

export interface JobsBody {
  queryParams?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface AssignJobBody {
  escrow_address: string;
  chain_id: number;
}

export interface RefreshJobsBody {
  oracle_address: string;
}

export interface ReportAbuseBody {
  escrow_address: string;
  chain_id: number;
  reason: string;
}
