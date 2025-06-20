import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { leaderboardResponseSchema } from '../model/leaderboardSchema';

const useLeaderboardDetails = (chainId: number, first?: number) => {
  return useQuery({
    queryFn: async () => {
      if (chainId === -1) {
        return [];
      }

      const { data } = await httpClient.get(apiPaths.leaderboardDetails.path, {
        params: { chainId, first },
      });

      const validResponse = validateResponse(data, leaderboardResponseSchema);

      return validResponse;
    },
    queryKey: ['useLeaderboardDetails', chainId, first],
  });
};

export default useLeaderboardDetails;
