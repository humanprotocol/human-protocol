import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FormProvider } from 'react-hook-form';
import { Box, Grid, Paper, Typography } from '@mui/material';

import { PageCardLoader } from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useResendEmailRouterParams, useResendEmail } from '../hooks';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { InboxIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';

export function EmailVerificationFormContainer() {
  const { email } = useResendEmailRouterParams() ?? {};
  const { methods, handleResend, isError, error, isSuccess } = useResendEmail();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      showNotification({
        message: getErrorMessageForError(error),
        type: TopNotificationType.ERROR,
      });
    }
  }, [isError, error, showNotification]);

  useEffect(() => {
    if (isSuccess && methods.formState.isSubmitSuccessful) {
      showNotification({
        message: t('worker.sendResetLinkSuccess.successResent'),
        type: TopNotificationType.SUCCESS,
      });
    }
  }, [isSuccess, methods.formState.isSubmitSuccessful, showNotification, t]);

  const handleCancel = () => {
    signOut();
    navigate(routerPaths.homePage);
  };

  if (!email) {
    return <PageCardLoader />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        my: { xs: 0, md: 4 },
        py: { xs: 8, md: 0 },
        px: { xs: 2, md: 0 },
        bgcolor: colorPalette.background.paper,
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: {
          xs: 'none',
          md: colorPalette.border.main,
        },
        overflow: 'hidden',
      }}
    >
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
            {!!user && (
              <>
                <HCaptchaForm name="h_captcha_token" />
                <Button
                  type="submit"
                  variant="outlined"
                  color="accent"
                  fullWidth
                >
                  {t('worker.verifyEmail.btn')}
                </Button>
              </>
            )}
          </Grid>
        </form>
      </FormProvider>
    </Paper>
  );
}
