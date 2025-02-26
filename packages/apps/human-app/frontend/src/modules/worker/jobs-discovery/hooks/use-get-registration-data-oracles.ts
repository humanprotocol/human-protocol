/* eslint-disable camelcase */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const RegisteredOraclesSuccessResponseSchema = z.object({
  oracle_addresses: z.array(z.string()),
});

async function getRegistrationDataInOracles() {
  return apiClient(apiPaths.worker.registrationInExchangeOracle.path, {
    authenticated: true,
    successSchema: RegisteredOraclesSuccessResponseSchema,
    options: { method: 'GET' },
  });
}

export function useGetRegistrationDataInOracles() {
  return useQuery({
    queryFn: () => getRegistrationDataInOracles(),
    queryKey: ['getRegistrationDataInOracles'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
  });
}
