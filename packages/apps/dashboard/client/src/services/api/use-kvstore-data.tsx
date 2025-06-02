import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';
import { z } from 'zod';
import { useWalletSearch } from '@/utils/hooks/use-wallet-search';

const kvstoreDataSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

export type KvstoreData = z.infer<typeof kvstoreDataSchema>;

const useKvstoreData = () => {
  const { filterParams } = useWalletSearch();

  return useQuery({
    queryKey: ['kvstoreData', filterParams.address],
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.kvstore.path}/${filterParams.address}`,
        { params: { chain_id: filterParams.chainId || -1 } }
      );

      const validResponse = validateResponse(data, kvstoreDataSchema);

      return validResponse;
    },
  });
};

export default useKvstoreData;
