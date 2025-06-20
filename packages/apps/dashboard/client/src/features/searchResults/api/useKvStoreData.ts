import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { kvstoreDataSchema } from '../model/kvStoreDataSchema';

const useKvstoreData = (chainId: number, address: string) => {
  return useQuery({
    queryKey: ['kvstoreData', address],
    queryFn: async () => {
      const { data } = await httpClient.get(
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
