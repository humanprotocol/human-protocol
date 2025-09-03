import { t } from 'i18next';
import { z } from 'zod';

export const resendEmailVerificationHcaptchaSchema = z.object({
  // eslint-disable-next-line camelcase
  h_captcha_token: z.string().min(1, t('validation.captcha')),
});

export type ResendEmailVerificationDto = z.infer<
  typeof resendEmailVerificationHcaptchaSchema
>;
