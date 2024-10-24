/* eslint-disable camelcase */
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export const registrationInExchangeOracleDtoSchema = z.object({
  oracle_address: z
    .string()
    .refine(
      (address) => ethers.isAddress(address),
      t('validation.invalidOracleAddress')
    ),
  h_captcha_token: z.string().min(1, t('validation.captcha')).default('token'),
});

export type RegistrationInExchangeOracleDto = z.infer<
  typeof registrationInExchangeOracleDtoSchema
>;

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
