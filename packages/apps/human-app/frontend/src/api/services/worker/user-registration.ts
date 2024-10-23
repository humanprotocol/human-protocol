/* eslint-disable camelcase */
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export const registrationDtoSchema = z.object({
  oracle_address: z
    .string()
    .refine(
      (address) => ethers.isAddress(address),
      t('validation.invalidOracleAddress')
    ),
  h_captcha_token: z.string().min(1, t('validation.captcha')).default('token'),
});

export type RegistrationDto = z.infer<typeof registrationDtoSchema>;

const UserRegistrationSuccessResponseSchema = z.unknown();

function userRegistrationMutationFn(data: RegistrationDto) {
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
