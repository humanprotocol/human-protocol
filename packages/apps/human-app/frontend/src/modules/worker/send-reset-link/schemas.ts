import { t } from 'i18next';
import { z } from 'zod';

const sendResetLinkEmailDtoSchema = z.object({
  email: z
    .email(t('worker.sendResetLinkForm.invalidEmailError'))
    .min(1, t('worker.sendResetLinkForm.noEmailError')),
});

type SendResetLinkEmail = z.infer<typeof sendResetLinkEmailDtoSchema>;

export const sendResetLinkHcaptchaDtoSchema = z.object({
  h_captcha_token: z.string().min(1, t('validation.captcha')).prefault('token'),
});

export type SendResetLinkHcaptcha = z.infer<
  typeof sendResetLinkHcaptchaDtoSchema
>;

export const sendResetLinkDtoSchema = sendResetLinkEmailDtoSchema.merge(
  sendResetLinkHcaptchaDtoSchema
);

export type SendResetLinkDto = SendResetLinkEmail & SendResetLinkHcaptcha;
