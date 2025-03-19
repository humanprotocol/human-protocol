import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { type RegistrationInExchangeOracleDto } from '../schema';

const RegistrationInExchangeOracleSuccessResponseSchema = z.unknown();

function registrationInExchangeOracleMutationFn(
  data: RegistrationInExchangeOracleDto
) {
  return apiClient(apiPaths.worker.registrationInExchangeOracle.path, {
    authenticated: true,
    successSchema: RegistrationInExchangeOracleSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useExchangeOracleRegistrationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrationInExchangeOracleMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
