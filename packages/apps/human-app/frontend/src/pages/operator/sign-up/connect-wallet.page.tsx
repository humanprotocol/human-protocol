import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { PageCard } from '@/components/ui/page-card';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Button } from '@/components/ui/button';
import { useModalStore } from '@/components/ui/modal/modal.store';
import { routerPaths } from '@/router/router-paths';

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

  if (isConnected) {
    return <Navigate replace to={routerPaths.operator.setUpOperator} />;
  }

  return (
    <PageCard alert={getAlert()} title={t('operator.connectWallet.title')}>
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
      </Grid>
    </PageCard>
  );
}
