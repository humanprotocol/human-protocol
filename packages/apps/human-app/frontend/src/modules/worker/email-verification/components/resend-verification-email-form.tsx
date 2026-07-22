import { FormProvider } from 'react-hook-form';
import { type z } from 'zod';
import { Box, Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import {
  type resendEmailVerificationHcaptchaSchema,
  type ResendEmailVerificationDto,
} from '../schemas';
import { useColorMode } from '@/shared/contexts/color-mode';
import { InboxIcon } from '@/shared/components/ui/icons';

interface ResendVerificationEmailFormProps {
  methods: UseFormReturn<
    z.input<typeof resendEmailVerificationHcaptchaSchema>,
    unknown,
    ResendEmailVerificationDto
  >;
  handleResend: (data: ResendEmailVerificationDto) => void;
  handleCancel: () => void;
  email: string;
  isAuthenticated: boolean;
}

export function ResendVerificationEmailForm({
  methods,
  handleResend,
  handleCancel,
  email,
  isAuthenticated,
}: ResendVerificationEmailFormProps) {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => {
          void methods.handleSubmit(handleResend)(event);
        }}
      >
        <Grid
          container
          sx={{
            width: { xs: '100%', md: 400 },
            flexDirection: 'column',
          }}
        >
          <InboxIcon
            sx={{ mb: 2.5, color: colorPalette.primary.main, fontSize: 54 }}
          />
          <Typography
            variant="h4"
            sx={{
              mb: 1,
              color: colorPalette.text.auxiliary100,
              fontSize: { xs: '32px', md: '34px' },
              fontWeight: { xs: 700, md: 800 },
              lineHeight: 'normal',
              textTransform: { xs: 'capitalize', md: 'none' },
            }}
          >
            {t('worker.verifyEmail.checkYourInbox')}
          </Typography>
          <Typography sx={{ mb: 3, color: colorPalette.text.auxiliary200 }}>
            <Trans
              components={{
                1: (
                  <Typography
                    component="span"
                    sx={{
                      color: colorPalette.primary.main,
                      fontWeight: 600,
                    }}
                  />
                ),
              }}
              i18nKey="worker.verifyEmail.paragraph1"
              values={{ email }}
            />
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 14,
              fontWeight: { xs: 600, md: 500 },
              lineHeight: { xs: '20px', md: '24px' },
              color: colorPalette.text.auxiliary100,
              mb: 3,
            }}
          >
            {t('worker.verifyEmail.paragraph2')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Button variant="outlined" fullWidth onClick={handleCancel}>
              {t('worker.verifyEmail.backToSignUp')}
            </Button>
          </Box>
          {isAuthenticated && (
            <>
              <HCaptchaForm name="h_captcha_token" />
              <Button type="submit" variant="outlined" color="accent" fullWidth>
                {t('worker.verifyEmail.btn')}
              </Button>
            </>
          )}
        </Grid>
      </form>
    </FormProvider>
  );
}
