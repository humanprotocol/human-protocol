import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { PageCard } from '@/components/ui/page-card';

export function ResetPasswordWorkerSuccessPage() {
  return (
    <PageCard title={t('worker.resetPasswordSuccess.title')}>
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
