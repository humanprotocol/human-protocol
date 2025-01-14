import { t } from 'i18next';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageCard } from '@/shared/components/ui/page-card';
import { SuccessLabel } from '@/shared/components/ui/success-label';
import { routerPaths } from '@/router/router-paths';

export function EmailVerificationSuccessMessage() {
  return (
    <PageCard
      hiddenArrowButton
      hiddenCancelButton
      title={<SuccessLabel>{t('worker.emailVerification.title')}</SuccessLabel>}
    >
      <Grid container gap="2rem">
        <Typography variant="body1">
          {t('worker.emailVerification.description')}
        </Typography>
        <Button
          component={Link}
          fullWidth
          to={routerPaths.worker.signIn}
          type="submit"
          variant="contained"
        >
          {t('worker.emailVerification.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}
