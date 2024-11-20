/* eslint-disable camelcase -- ... */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { useGetKeys } from '@/api/services/operator/get-keys';

const operatorStatsSuccessResponseSchema = z.object({
  workers_total: z.number(),
  assignments_completed: z.number(),
  assignments_expired: z.number(),
  assignments_rejected: z.number(),
  escrows_processed: z.number(),
  escrows_active: z.number(),
  escrows_cancelled: z.number(),
});

export type OperatorStatsSuccessResponse = z.infer<
  typeof operatorStatsSuccessResponseSchema
>;

const failedResponse = {
  workers_total: '-',
  assignments_completed: '-',
  assignments_expired: '-',
  assignments_rejected: '-',
  escrows_processed: '-',
  escrows_active: '-',
  escrows_cancelled: '-',
};

export function useGetOperatorStats() {
  const { data: keysData } = useGetKeys();

  return useQuery({
    queryFn: async () => {
      if (!keysData?.url) {
        return failedResponse;
      }
      return apiClient
        .fetcher(`/stats`, {
          baseUrl: keysData.url,
          successSchema: operatorStatsSuccessResponseSchema,
          options: {
            method: 'GET',
          },
        })
        .catch(() => failedResponse);
    },
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- ...
    queryKey: ['getOperatorStats', keysData?.url],
  });
}
