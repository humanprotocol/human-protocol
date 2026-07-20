import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import { Navigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageCardError } from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import { useEnableHCaptchaLabelingMutation } from './hooks';

export function EnableLabelerPage() {
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
      size={12}
      sx={{ alignItems: 'center', height: '100%', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          height: '100%',
          boxShadow: 'none',
          padding: { xs: 2.5, md: 5 },
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
              variant="contained"
              fullWidth
              loading={isPending}
              onClick={() => {
                mutate();
              }}
            >
              {t('worker.enableHCaptchaLabeling.enableButton')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
