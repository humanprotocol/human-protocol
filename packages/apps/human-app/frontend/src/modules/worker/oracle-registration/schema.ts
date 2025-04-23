/* eslint-disable camelcase */
import { ethers } from 'ethers';
import { t } from 'i18next';
import { z } from 'zod';

const registrationInExchangeOracleDtoSchema = z.object({
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

export const oracleRegistrationFormSchema = z.object({
  h_captcha_token: z.string().min(1, t('validation.captcha')),
});

export type OracleRegistrationFormValues = z.infer<
  typeof oracleRegistrationFormSchema
>;
