import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { ConnectWalletBtn } from '@/shared/components/ui/connect-wallet-btn';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { breakpoints } from '@/shared/styles/breakpoints';

export function WalletConnectModal({ close }: Readonly<{ close: () => void }>) {
  const { isConnected } = useWalletConnect();

  useEffect(() => {
    if (isConnected) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [isConnected]);

  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        paddingX: '60px',
        [breakpoints.mobile]: {
          paddingX: '6px',
        },
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '42px',
          flexDirection: 'column',
          maxWidth: '352px',
        }}
      >
        <Typography variant="h4">{t('walletConnectModal.header')}</Typography>
        <Grid
          container
          sx={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <Typography variant="body1">
            <Trans i18nKey="walletConnectModal.paragraph" />
          </Typography>
          <ConnectWalletBtn fullWidth>
            {t('walletConnectModal.connectBtn')}
          </ConnectWalletBtn>
          <Button
            fullWidth
            onClick={() => {
              close();
            }}
            variant="outlined"
          >
            {t('walletConnectModal.cancelBtn')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}
