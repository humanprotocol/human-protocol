import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { PageCard } from '@/components/ui/page-card';
import { colorPalette } from '@/styles/color-palette';

export function ResetPasswordWorkerSuccessPage() {
  return (
    <PageCard
      hiddenCancelButton
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
      <Grid container gap="2rem">
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
