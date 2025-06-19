import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

import { kvstoreDataSchema } from '../model/kvStoreDataSchema';

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
