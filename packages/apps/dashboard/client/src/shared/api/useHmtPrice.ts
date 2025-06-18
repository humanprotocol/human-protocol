import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

const hmtPriceResponseSchema = z.object({
  hmtPrice: z.number(),
});

export type HmtPrice = z.infer<typeof hmtPriceResponseSchema>;

const useHmtPrice = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(apiPaths.statsHmtPrice.path);

      const validResponse = validateResponse(data, hmtPriceResponseSchema);

      return validResponse.hmtPrice;
    },
    queryKey: ['useHmtPrice'],
  });
};

export default useHmtPrice;
