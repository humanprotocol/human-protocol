import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';
import { useLeaderboardSearch } from '@/utils/hooks/use-leaderboard-search';

import { leaderboardResponseSchema } from '../model/leaderboardSchema';

const useLeaderboardDetails = (first?: number) => {
  const {
    filterParams: { chainId },
  } = useLeaderboardSearch();

  return useQuery({
    queryFn: async () => {
      if (chainId === -1) {
        return [];
      }

      const { data } = await httpService.get(apiPaths.leaderboardDetails.path, {
        params: { chainId, first },
      });

      const validResponse = validateResponse(data, leaderboardResponseSchema);

      return validResponse;
    },
    queryKey: ['useLeaderboardDetails', chainId, first],
  });
};

export default useLeaderboardDetails;
