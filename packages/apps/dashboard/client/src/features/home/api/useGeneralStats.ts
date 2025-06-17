import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

import { generalStatsResponseSchema } from '../model/generalStats';

const useGeneralStats = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(apiPaths.generalStats.path);

      const validResponse = validateResponse(data, generalStatsResponseSchema);

      return validResponse;
    },
    queryKey: ['useGeneralStats'],
  });
};

export default useGeneralStats;
