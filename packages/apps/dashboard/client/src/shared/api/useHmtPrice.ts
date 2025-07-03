import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import validateResponse from '@/shared/lib/validateResponse';

import apiPaths from './apiPaths';
import httpClient from './httpClient';

const hmtPriceResponseSchema = z.object({
  hmtPrice: z.number(),
});

export type HmtPrice = z.infer<typeof hmtPriceResponseSchema>;

const useHmtPrice = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpClient.get(apiPaths.statsHmtPrice.path);

      const validResponse = validateResponse(data, hmtPriceResponseSchema);

      return validResponse.hmtPrice;
    },
    queryKey: ['useHmtPrice'],
  });
};

export default useHmtPrice;
