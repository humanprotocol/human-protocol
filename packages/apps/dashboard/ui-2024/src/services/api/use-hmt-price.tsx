import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';

const successHMTPriceResponseSchema = z.object({
  hmtPrice: z.number(),
});

export type HMTPrice = z.infer<typeof successHMTPriceResponseSchema>;

export function useHMTPrice() {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(apiPaths.statsHmtPrice.path);

      const validResponse = validateResponse(
        data,
        successHMTPriceResponseSchema
      );

      return validResponse;
    },
    queryKey: ['useHMTPrice'],
  });
}
