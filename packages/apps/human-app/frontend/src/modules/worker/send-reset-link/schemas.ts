import { t } from 'i18next';
import { z } from 'zod';

const sendResetLinkEmailDtoSchema = z.object({
  email: z
    .string()
    .min(1, t('worker.sendResetLinkForm.noEmailError'))
    .email(t('worker.sendResetLinkForm.invalidEmailError')),
});

type SendResetLinkEmail = z.infer<typeof sendResetLinkEmailDtoSchema>;

export const sendResetLinkHcaptchaDtoSchema = z.object({
  // eslint-disable-next-line camelcase
  h_captcha_token: z.string().min(1, t('validation.captcha')).default('token'),
});

export type SendResetLinkHcaptcha = z.infer<
  typeof sendResetLinkHcaptchaDtoSchema
>;

export const sendResetLinkDtoSchema = sendResetLinkEmailDtoSchema.merge(
  sendResetLinkHcaptchaDtoSchema
);

export type SendResetLinkDto = SendResetLinkEmail & SendResetLinkHcaptcha;
