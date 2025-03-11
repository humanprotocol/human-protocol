import { t } from 'i18next';
import { z } from 'zod';

export const resendEmailVerificationHcaptchaSchema = z.object({
  // eslint-disable-next-line camelcase
  h_captcha_token: z.string().min(1, t('validation.captcha')).default('token'),
});

type ResendEmailVerificationHcaptchaDto = z.infer<
  typeof resendEmailVerificationHcaptchaSchema
>;

const resendEmailVerificationEmailSchema = z.object({
  email: z.string().email(),
});

type ResendEmailVerificationEmailDto = z.infer<
  typeof resendEmailVerificationEmailSchema
>;

export type ResendEmailVerificationDto = ResendEmailVerificationHcaptchaDto &
  ResendEmailVerificationEmailDto;
