/* eslint-disable camelcase */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const RegisteredOraclesSuccessResponseSchema = z.object({
  oracle_addresses: z.array(z.string()),
});

export async function getRegistrationInExchangeOracles() {
  return apiClient.fetcher(apiPaths.worker.registrationInExchangeOracle.path, {
    authenticated: true,
    successSchema: RegisteredOraclesSuccessResponseSchema,
    options: { method: 'GET' },
  });
}

export function useGetRegistrationInExchangeOracles() {
  return useQuery({
    queryFn: () => getRegistrationInExchangeOracles(),
    queryKey: ['getRegistrationInExchangeOracles'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
  });
}
