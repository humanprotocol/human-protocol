import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageCard } from '@/components/ui/page-card';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useModalStore } from '@/components/ui/modal/modal.store';

export function ConnectWalletOperatorPage() {
  const { t } = useTranslation();
  const { openModal } = useModalStore();
  const {
    isConnected,
    web3ProviderMutation: {
      error: web3ProviderError,
      status: web3ProviderStatus,
    },
  } = useWalletConnect();

  const getAlert = () => {
    switch (true) {
      case web3ProviderStatus === 'error':
        return (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {defaultErrorMessage(web3ProviderError)}
          </Alert>
        );
      case isConnected:
        return (
          <Alert color="success" severity="success" sx={{ width: '100%' }}>
            {t('operator.connectWallet.successAlert')}
          </Alert>
        );

      default:
        return undefined;
    }
  };

  return (
    <PageCard
      alert={getAlert()}
      backArrowPath={-1}
      title={t('operator.connectWallet.title')}
    >
      <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
        <Typography variant="body1">
          {t('operator.connectWallet.description')}
        </Typography>
        <Button
          onClick={() => {
            openModal('WALLET_CONNECT');
          }}
          variant="contained"
        >
          {t('components.wallet.connectBtn.connect')}
        </Button>
        {isConnected ? (
          <Button
            component={Link}
            to={routerPaths.operator.addStake}
            variant="contained"
          >
            {t('operator.connectWallet.setupOperator')}
          </Button>
        ) : null}
      </Grid>
    </PageCard>
  );
}
