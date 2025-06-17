import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

import { hcaptchaGeneralStatsResponseSchema } from '../model/hcaptchaGeneralStats';

const useHcaptchaGeneralStats = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        apiPaths.hcaptchaGeneralStats.path
      );

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
