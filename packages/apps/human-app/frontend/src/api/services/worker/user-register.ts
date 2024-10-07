/* eslint-disable camelcase */
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const UserRegistrationSuccessResponseSchema = z.unknown();

function userRegistrationMutationFn(oracleAddress: string) {
  const data = { oracle_address: oracleAddress };
  return apiClient(apiPaths.worker.userRegistration.path, {
    authenticated: true,
    successSchema: UserRegistrationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useUserRegistrationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userRegistrationMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
