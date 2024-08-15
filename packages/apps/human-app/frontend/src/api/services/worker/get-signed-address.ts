import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const signedAddressSuccessSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type SignedAddressSuccess = z.infer<typeof signedAddressSuccessSchema>;

const getSignedAddress = async () => {
  return apiClient(apiPaths.worker.signedAddress.path, {
    authenticated: true,
    successSchema: signedAddressSuccessSchema,
    options: {
      method: 'GET',
    },
  });
};

export function useGetSignedAddress() {
  return useQuery({
    queryKey: ['getSignedAddress'],
    queryFn: getSignedAddress,
  });
}
