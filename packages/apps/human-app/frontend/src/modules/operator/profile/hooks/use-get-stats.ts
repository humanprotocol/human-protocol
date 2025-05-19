/* eslint-disable camelcase -- ... */
import { useQuery } from '@tanstack/react-query';
import { useGetKeys } from '@/modules/operator/hooks/use-get-keys';
import * as operatorProfileService from '../services/profile.service';

export const failedResponse = {
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
      return operatorProfileService
        .getStats(keysData.url)
        .catch(() => failedResponse);
    },
    queryKey: ['getOperatorStats', keysData?.url],
  });
}
