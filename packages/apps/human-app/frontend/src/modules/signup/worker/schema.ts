import { t } from 'i18next';
import { z } from 'zod';

export const signUpDtoSchema = z
  .object({
    email: z.string().email(t('validation.invalidEmail')),
    // eslint-disable-next-line camelcase -- export vite config
    h_captcha_token: z
      .string()
      .min(1, t('validation.captcha'))
      .default('token'),
  })
  .and(
    z
      .object({
        password: z
          .string()
          .min(8, t('validation.min'))
          .max(50, t('validation.max', { count: 50 })),
        confirmPassword: z
          .string()
          .min(1, t('validation.required'))
          .max(50, t('validation.max', { count: 50 })),
      })
      .refine(({ password, confirmPassword }) => confirmPassword === password, {
        message: t('validation.passwordMismatch'),
        path: ['confirmPassword'],
      })
  );

export type SignUpDto = z.infer<typeof signUpDtoSchema>;
