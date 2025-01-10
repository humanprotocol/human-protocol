import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useEnableHCaptchaLabelingMutation } from '@/modules/worker/services/enable-hcaptcha-labeling';
import { Button } from '@/shared/components/ui/button';
import { PageCardError } from '@/shared/components/ui/page-card/page-card-error';
import { getErrorMessageForError } from '@/shared/errors';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';

export function EnableLabeler() {
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();
  const { mutate, error, isError, isPending } =
    useEnableHCaptchaLabelingMutation();

  if (!user.wallet_address) {
    return <Navigate replace to={routerPaths.worker.profile} />;
  }

  if (isError) {
    return <PageCardError errorMessage={getErrorMessageForError(error)} />;
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
          height: '100%',
          boxShadow: 'none',
          padding: isMobile ? '20px' : '40px',
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
