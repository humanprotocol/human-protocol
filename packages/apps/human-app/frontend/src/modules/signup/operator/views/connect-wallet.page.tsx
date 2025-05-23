import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { PageCard } from '@/shared/components/ui/page-card';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useWalletConnectModal } from '@/modules/auth-web3/hooks/use-wallet-connect-modal';

export function ConnectWalletOperatorPage() {
  const { t } = useTranslation();
  const {
    isConnected,
    web3ProviderMutation: {
      error: web3ProviderError,
      status: web3ProviderStatus,
    },
  } = useWalletConnect();
  const { openModal } = useWalletConnectModal();

  const getAlert = () => {
    if (web3ProviderStatus === 'error')
      return (
        <Alert color="error" severity="error" sx={{ width: '100%' }}>
          {getErrorMessageForError(web3ProviderError)}
        </Alert>
      );

    if (isConnected)
      return (
        <Alert color="success" severity="success" sx={{ width: '100%' }}>
          {t('operator.connectWallet.successAlert')}
        </Alert>
      );

    return undefined;
  };

  if (isConnected) {
    return <Navigate replace to={routerPaths.operator.setUpOperator} />;
  }

  return (
    <PageCard alert={getAlert()} title={t('operator.connectWallet.title')}>
      <Grid container sx={{ flexDirection: 'column', gap: '1.5rem' }}>
        <Typography variant="body1">
          {t('operator.connectWallet.description')}
        </Typography>
        <Button onClick={openModal} variant="contained">
          {t('components.wallet.connectBtn.connect')}
        </Button>
      </Grid>
    </PageCard>
  );
}
