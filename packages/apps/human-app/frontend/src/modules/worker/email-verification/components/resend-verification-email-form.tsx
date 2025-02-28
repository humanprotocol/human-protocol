import { FormProvider } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import type { ResendEmailVerificationDto } from '@/modules/worker/services/resend-email-verification';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { MailTo } from '@/shared/components/ui/mail-to';
import { env } from '@/shared/env';

interface ResendVerificationEmailFormProps {
  methods: UseFormReturn<Pick<ResendEmailVerificationDto, 'h_captcha_token'>>;
  handleResend: (
    data: Pick<ResendEmailVerificationDto, 'h_captcha_token'>
  ) => void;
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
        <Grid container gap="2rem" sx={{ paddingTop: '1rem' }}>
          <Typography>
            <Trans
              components={{
                1: <Typography component="span" fontWeight={600} />,
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
                1: <Typography component="span" fontWeight={600} />,
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
                    fontWeight={600}
                    variant="body1"
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
