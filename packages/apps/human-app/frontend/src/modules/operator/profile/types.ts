import { type z } from 'zod';
import { type failedResponse } from './hooks';
import { type operatorStatsSuccessResponseSchema } from './schemas';

export type OperatorStatsSuccessResponse = z.infer<
  typeof operatorStatsSuccessResponseSchema
>;

export type OperatorStatsFailedResponse = typeof failedResponse;

export type OperatorStatsResponse =
  | OperatorStatsSuccessResponse
  | OperatorStatsFailedResponse;
