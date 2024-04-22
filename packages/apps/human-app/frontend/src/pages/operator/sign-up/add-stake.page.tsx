import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageCard } from '@/components/ui/page-card';
import { useGetStakedAmountMutation } from '@/api/servieces/operator/add-stake';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';

export function AddStakeOperatorPage() {
  const _r = useGetStakedAmountMutation();
  const { t } = useTranslation();

  return (
    <PageCard backArrowPath={-1} title={t('operator.addStake.title')}>
      <Grid
        container
        sx={{ flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}
      >
        <Typography variant="h5">
          {t('operator.addStake.formHeader')}
        </Typography>
        <Typography variant="subtitle2">
          {t('operator.addStake.label')}
        </Typography>
        <Grid
          container
          gap="1rem"
          sx={{
            flex: '1',
            flexWrap: 'nowrap',
            [breakpoints.mobile]: {
              flexWrap: 'wrap',
            },
          }}
        >
          <Button fullWidth variant="contained">
            {t('operator.addStake.actionBtn')}
          </Button>
          <Button component={Link} fullWidth to="/next-page" variant="outlined">
            {t('operator.addStake.nextBtn')}
          </Button>
        </Grid>
      </Grid>
    </PageCard>
  );
}
