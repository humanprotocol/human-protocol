import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useEnableHCaptchaLabelingMutation } from '@/api/servieces/worker/enable-hcaptcha-labeling';
import { Button } from '@/components/ui/button';
import { PageCardError } from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { breakpoints } from '@/styles/theme';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';

export function EnableLabeler() {
  const isMobile = useIsMobile();
  const { closeNotification } = useProtectedLayoutNotification();
  const { user } = useAuthenticatedUser();
  const { mutate, error, isError, isPending, status } =
    useEnableHCaptchaLabelingMutation();

  useEffect(() => {
    if (status === 'success') {
      closeNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [status]);

  if (!user.wallet_address) {
    return <Navigate replace to={routerPaths.worker.profile} />;
  }

  if (user.site_key) {
    return <Navigate replace to={routerPaths.worker.HcaptchaLabeling} />;
  }

  if (isError) {
    return <PageCardError errorMessage={defaultErrorMessage(error)} />;
  }

  return (
    <Grid
      alignItems="center"
      height="100%"
      item
      justifyContent="center"
      xs={12}
    >
      <Paper
        sx={{
          backgroundColor: isMobile
            ? colorPalette.paper.main
            : colorPalette.white,
          height: '100%',
          boxShadow: 'none',
          padding: '40px',
          borderRadius: '20px',
        }}
      >
        <Grid
          container
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Grid
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              height: '100%',
              width: '376px',
              gap: '52px',
              [breakpoints.mobile]: {
                width: 'unset',
              },
            }}
          >
            <Typography variant="body1">
              {t('worker.enableHCaptchaLabeling.description')}
            </Typography>

            <Button
              fullWidth
              loading={isPending}
              onClick={() => {
                mutate();
              }}
              variant="contained"
            >
              {t('worker.enableHCaptchaLabeling.enableButton')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
