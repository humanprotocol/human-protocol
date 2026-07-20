import { FormProvider } from 'react-hook-form';
import { type z } from 'zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { MailTo } from '@/shared/components/ui/mail-to';
import { env } from '@/shared/env';
import {
  type resendEmailVerificationHcaptchaSchema,
  type ResendEmailVerificationDto,
} from '../schemas';

interface ResendVerificationEmailFormProps {
  methods: UseFormReturn<
    z.input<typeof resendEmailVerificationHcaptchaSchema>,
    unknown,
    ResendEmailVerificationDto
  >;
  handleResend: (data: ResendEmailVerificationDto) => void;
  email: string;
  isAuthenticated: boolean;
}

export function ResendVerificationEmailForm({
  methods,
  handleResend,
  email,
  isAuthenticated,
}: Readonly<ResendVerificationEmailFormProps>) {
  const { t } = useTranslation();

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => {
          void methods.handleSubmit(handleResend)(event);
        }}
      >
        <Grid container sx={{ gap: 4, pt: 2 }}>
          <Typography>
            <Trans
              components={{
                1: <Typography component="span" sx={{ fontWeight: 600 }} />,
              }}
              i18nKey="worker.verifyEmail.paragraph1"
              values={{ email }}
            />
          </Typography>
          <Typography variant="body1">
            {t('worker.verifyEmail.paragraph2')}
          </Typography>
          <Typography variant="body1">
            <Trans
              components={{
                1: <Typography component="span" sx={{ fontWeight: 600 }} />,
              }}
              i18nKey="worker.verifyEmail.paragraph3"
            />
          </Typography>
          <Typography variant="body1">
            <Trans
              components={{
                1: (
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ fontWeight: 600 }}
                  />
                ),
                2: <MailTo mail={env.VITE_HUMAN_SUPPORT_EMAIL} />,
              }}
              i18nKey="worker.verifyEmail.paragraph4"
            />
          </Typography>
          {isAuthenticated && (
            <>
              <HCaptchaForm name="h_captcha_token" />
              <Button fullWidth type="submit" variant="outlined">
                {t('worker.verifyEmail.btn')}
              </Button>
            </>
          )}
        </Grid>
      </form>
    </FormProvider>
  );
}
