import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

const kvstoreDataSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

export type KvstoreData = z.infer<typeof kvstoreDataSchema>;

const useKvstoreData = (chainId: number, address: string) => {
  return useQuery({
    queryKey: ['kvstoreData', address],
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.kvstore.path}/${address}`,
        { params: { chain_id: chainId || -1 } }
      );

      const validResponse = validateResponse(data, kvstoreDataSchema);

      return validResponse;
    },
    enabled: !!chainId && !!address,
  });
};

export default useKvstoreData;
