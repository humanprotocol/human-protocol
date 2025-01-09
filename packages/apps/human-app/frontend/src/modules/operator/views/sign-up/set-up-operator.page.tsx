import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/modules/auth-web3/hooks/use-connected-wallet';

export function SetUpOperatorPage() {
  const { t } = useTranslation();
  useConnectedWallet();
  return (
    <PageCard
      alert={
        <Alert color="success" severity="success" sx={{ width: '100%' }}>
          {t('operator.connectWallet.successAlert')}
        </Alert>
      }
      title={t('operator.connectWallet.title')}
    >
      <Grid container sx={{ flexDirection: 'column', gap: '1.5rem' }}>
        <Typography variant="body1">
          {t('operator.connectWallet.description')}
        </Typography>
        <Button
          component={Link}
          to={routerPaths.operator.addStake}
          variant="contained"
        >
          {t('operator.connectWallet.setupOperator')}
        </Button>
      </Grid>
    </PageCard>
  );
}
