import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { hcaptchaGeneralStatsResponseSchema } from '../model/hcaptchaGeneralStats';

const useHcaptchaGeneralStats = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpClient.get(apiPaths.hcaptchaGeneralStats.path);

      const validResponse = validateResponse(
        data,
        hcaptchaGeneralStatsResponseSchema
      );

      return validResponse;
    },
    queryKey: ['useHcaptchaGeneralStats'],
  });
};

export default useHcaptchaGeneralStats;
