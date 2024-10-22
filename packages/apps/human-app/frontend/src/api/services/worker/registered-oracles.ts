/* eslint-disable camelcase */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const RegisteredOraclesSuccessResponseSchema = z.object({
  oracle_addresses: z.array(z.string()),
});

export async function getRegisteredOracles() {
  return apiClient(apiPaths.worker.userRegistration.path, {
    authenticated: true,
    successSchema: RegisteredOraclesSuccessResponseSchema,
    options: { method: 'GET' },
  });
}

export function useGetRegisteredOracles() {
  return useQuery({
    queryFn: () => getRegisteredOracles(),
    queryKey: ['getRegisteredOracles'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
  });
}
