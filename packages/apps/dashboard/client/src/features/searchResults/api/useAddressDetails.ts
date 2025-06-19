import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

import { addressDetailsResponseSchema } from '../model/addressDetailsSchema';

const useAddressDetails = (chainId: number, address: string) => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.addressDetails.path}/${address}`,
        { params: { chainId: chainId || -1 } }
      );

      const validResponse = validateResponse(
        data,
        addressDetailsResponseSchema
      );

      return validResponse;
    },
    queryKey: ['useAddressDetails', address, chainId],
    enabled: !!chainId && !!address,
  });
};

export default useAddressDetails;
