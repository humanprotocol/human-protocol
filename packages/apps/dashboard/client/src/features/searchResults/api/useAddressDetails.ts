import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { addressDetailsResponseSchema } from '../model/addressDetailsSchema';

const useAddressDetails = (chainId: number, address: string) => {
  return useQuery({
    queryFn: async () => {
      const { data } = await httpClient.get(
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
