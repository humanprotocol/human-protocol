import { z } from 'zod';
import { t } from 'i18next';

export const signInDtoSchema = z.object({
  email: z.email(t('validation.invalidEmail')),
  password: z
    .string()
    .min(1, t('validation.passwordMissing'))
    .max(50, t('validation.max', { count: 50 })),
  // eslint-disable-next-line camelcase -- export vite config
  h_captcha_token: z.string().min(1, t('validation.captcha')).prefault('token'),
});

export type SignInDto = z.infer<typeof signInDtoSchema>;
