import { t } from 'i18next';
import { z } from 'zod';

export const signUpDtoSchema = z
  .object({
    email: z.email(t('validation.invalidEmail')),
    hCaptchaToken: z.string().min(1, t('validation.captcha')).prefault('token'),
  })
  .and(
    z
      .object({
        password: z
          .string()
          .min(8, t('validation.min'))
          .max(50, t('validation.max', { count: 50 })),
        confirmPassword: z.string().min(1, t('validation.required')),
      })
      .refine(({ password, confirmPassword }) => confirmPassword === password, {
        message: t('validation.passwordMismatch'),
        path: ['confirmPassword'],
      })
  );

export type SignUpDto = z.infer<typeof signUpDtoSchema>;
