import { t } from 'i18next';
import { z } from 'zod';

export const resetPasswordDtoSchema = z
  .object({
    password: z
      .string()
      .min(8, t('validation.min'))
      .max(50, t('validation.max', { count: 50 })),
    confirmPassword: z
      .string()
      .min(1, t('validation.required'))
      .max(50, t('validation.max', { count: 50 })),
    // eslint-disable-next-line camelcase
    h_captcha_token: z
      .string()
      .min(1, t('validation.captcha'))
      .prefault('token'),
  })
  .refine(({ password, confirmPassword }) => confirmPassword === password, {
    message: t('validation.passwordMismatch'),
    path: ['confirmPassword'],
  });
