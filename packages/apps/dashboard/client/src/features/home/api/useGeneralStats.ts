import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { generalStatsResponseSchema } from '../model/generalStats';

const useGeneralStats = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpClient.get(apiPaths.generalStats.path);

      const validResponse = validateResponse(data, generalStatsResponseSchema);

      return validResponse;
    },
    queryKey: ['useGeneralStats'],
  });
};

export default useGeneralStats;
