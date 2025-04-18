import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { PageCard } from '@/shared/components/ui/page-card';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useColorMode } from '@/shared/contexts/color-mode';

export function ResetPasswordWorkerSuccessPage() {
  const { colorPalette } = useColorMode();
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);
  return (
    <PageCard
      showCancelButton={false}
      title={
        <Grid
          container
          sx={{ gap: '1rem', justifyContent: 'start', alignItems: 'center' }}
        >
          {t('worker.resetPasswordSuccess.title')}
          <CheckCircle
            fontSize="large"
            sx={{ fill: colorPalette.success.main }}
          />
        </Grid>
      }
    >
      <Grid container gap="1.5rem">
        <Typography variant="body1">
          {t('worker.resetPasswordSuccess.description')}
        </Typography>
        <Button
          component={Link}
          fullWidth
          to={routerPaths.worker.signIn}
          type="submit"
          variant="contained"
        >
          {t('worker.resetPasswordSuccess.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}
